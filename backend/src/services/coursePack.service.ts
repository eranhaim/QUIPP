import mongoose, { isValidObjectId } from 'mongoose';
import Stripe from 'stripe';
import { env } from '../config/env.js';
import { Course } from '../models/Course.js';
import { CourseAccessPack } from '../models/CourseAccessPack.js';
import { CourseAssignment } from '../models/CourseAssignment.js';
import { Payment } from '../models/Payment.js';
import { SeatAssignment } from '../models/SeatAssignment.js';
import { WorkplaceLink } from '../models/WorkplaceLink.js';
import { HttpError } from '../middleware/errorHandler.js';
import { getOperatorAccess } from './operator.service.js';

export interface CheckoutCoursePackInput {
  courseId?: string;
  courseSlug?: string;
  quantity: number;
}

let stripeClient: Stripe | null = null;

function stripe(): Stripe {
  if (!env.STRIPE_SECRET_KEY) {
    throw new HttpError(503, 'Stripe checkout is not configured');
  }
  stripeClient ??= new Stripe(env.STRIPE_SECRET_KEY);
  return stripeClient;
}

async function resolvePublishedCourse(input: CheckoutCoursePackInput) {
  let course = null;
  if (input.courseId) {
    if (!isValidObjectId(input.courseId)) throw new HttpError(400, 'Invalid courseId');
    course = await Course.findById(input.courseId);
  } else if (input.courseSlug) {
    course = await Course.findOne({ slug: input.courseSlug.toLowerCase() });
  }
  if (!course) throw new HttpError(404, 'Course not found');
  if (course.status !== 'published') {
    throw new HttpError(400, 'Only published courses can be purchased');
  }
  return course;
}

export async function checkoutCoursePack(userId: string, input: CheckoutCoursePackInput) {
  const [{ operator }, course] = await Promise.all([
    getOperatorAccess(userId),
    resolvePublishedCourse(input),
  ]);
  if (
    course.visibility === 'organization' &&
    String(course.ownerOperatorId) !== String(operator._id)
  ) {
    throw new HttpError(403, 'This course is private to another organization');
  }
  const amountCents = course.priceCents * input.quantity;

  if (amountCents === 0) {
    const dbSession = await mongoose.startSession();
    let result:
      | {
          payment: InstanceType<typeof Payment>;
          pack: InstanceType<typeof CourseAccessPack>;
        }
      | undefined;
    try {
      await dbSession.withTransaction(async () => {
        const [payment] = await Payment.create(
          [
            {
              operatorId: operator._id,
              userId,
              amountCents,
              currency: env.STRIPE_CURRENCY,
              status: 'paid',
              quantity: input.quantity,
              courseId: course._id,
              paidAt: new Date(),
            },
          ],
          { session: dbSession },
        );
        const [pack] = await CourseAccessPack.create(
          [
            {
              operatorId: operator._id,
              courseId: course._id,
              paymentId: payment._id,
              quantity: input.quantity,
            },
          ],
          { session: dbSession },
        );
        result = { payment, pack };
      });
    } finally {
      await dbSession.endSession();
    }
    if (!result) throw new HttpError(500, 'Could not create course pack');
    return {
      checkoutUrl: null,
      checkoutSessionId: null,
      ...result,
    };
  }

  const client = stripe();
  const payment = await Payment.create({
    operatorId: operator._id,
    userId,
    amountCents,
    currency: env.STRIPE_CURRENCY,
    status: 'pending',
    quantity: input.quantity,
    courseId: course._id,
  });

  try {
    const checkout = await client.checkout.sessions.create({
      mode: 'payment',
      success_url: `${env.APP_URL}/operator/course-packs/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${env.APP_URL}/operator/course-packs/cancel`,
      client_reference_id: String(payment._id),
      metadata: {
        paymentId: String(payment._id),
        operatorId: String(operator._id),
        courseId: String(course._id),
        quantity: String(input.quantity),
      },
      line_items: [
        {
          quantity: input.quantity,
          price_data: {
            currency: env.STRIPE_CURRENCY,
            unit_amount: course.priceCents,
            product_data: { name: `${course.title} course seat` },
          },
        },
      ],
    });
    payment.stripeCheckoutSessionId = checkout.id;
    await payment.save();
    return {
      checkoutUrl: checkout.url,
      checkoutSessionId: checkout.id,
      payment,
      pack: null,
    };
  } catch (error) {
    payment.status = 'failed';
    payment.failureReason = error instanceof Error ? error.message : 'Stripe checkout failed';
    await payment.save();
    throw new HttpError(502, 'Unable to create Stripe checkout session');
  }
}

export async function listCoursePacks(userId: string) {
  const { operator } = await getOperatorAccess(userId);
  return CourseAccessPack.find({ operatorId: operator._id })
    .populate('courseId', 'slug title priceCents status visibility')
    .populate('paymentId', 'amountCents currency status paidAt')
    .sort({ createdAt: -1 });
}

export async function assignCoursePackSeat(userId: string, packId: string, workerId: string) {
  if (!isValidObjectId(packId)) throw new HttpError(400, 'Invalid pack id');
  if (!isValidObjectId(workerId)) throw new HttpError(400, 'Invalid workerId');
  const { operator } = await getOperatorAccess(userId);

  const pack = await CourseAccessPack.findOne({ _id: packId, operatorId: operator._id });
  if (!pack) throw new HttpError(404, 'Course pack not found');

  const existing = await SeatAssignment.findOne({
    operatorId: operator._id,
    courseId: pack.courseId,
    workerId,
  });
  if (existing) {
    const assignment = await CourseAssignment.findOne({
      operatorId: operator._id,
      courseId: pack.courseId,
      workerId,
    });
    return { seat: existing, assignment };
  }

  const link = await WorkplaceLink.findOne({
    operatorId: operator._id,
    workerId,
    status: 'active',
  });
  if (!link) throw new HttpError(400, 'Worker must have an active workplace link');

  const dbSession = await mongoose.startSession();
  let result:
    | {
        seat: InstanceType<typeof SeatAssignment>;
        assignment: InstanceType<typeof CourseAssignment>;
      }
    | undefined;
  try {
    await dbSession.withTransaction(async () => {
      const now = new Date();
      const reservedPack = await CourseAccessPack.findOneAndUpdate(
        {
          _id: pack._id,
          operatorId: operator._id,
          status: 'active',
          assignedCount: { $lt: pack.quantity },
          $or: [{ expiresAt: null }, { expiresAt: { $gt: now } }],
        },
        { $inc: { assignedCount: 1 } },
        { new: true, session: dbSession },
      );
      if (!reservedPack) throw new HttpError(409, 'Course pack has no available seats');

      const [seat] = await SeatAssignment.create(
        [
          {
            packId: reservedPack._id,
            operatorId: operator._id,
            courseId: reservedPack.courseId,
            workerId,
            assignedBy: userId,
          },
        ],
        { session: dbSession },
      );
      const assignment = await CourseAssignment.findOneAndUpdate(
        {
          operatorId: operator._id,
          workerId,
          courseId: reservedPack.courseId,
        },
        {
          $setOnInsert: {
            locationId: link.locationId ?? null,
            courseSlug: (await Course.findById(reservedPack.courseId)
              .select('slug')
              .session(dbSession))?.slug,
            assignedBy: userId,
            status: 'assigned',
            assignedAt: now,
          },
        },
        { upsert: true, new: true, session: dbSession, runValidators: true },
      );
      if (reservedPack.assignedCount >= reservedPack.quantity) {
        await CourseAccessPack.updateOne(
          { _id: reservedPack._id },
          { $set: { status: 'exhausted' } },
          { session: dbSession },
        );
      }
      result = { seat, assignment };
    });
  } catch (error) {
    const duplicate = error as { code?: number };
    if (duplicate.code === 11000) {
      const seat = await SeatAssignment.findOne({
        operatorId: operator._id,
        courseId: pack.courseId,
        workerId,
      });
      const assignment = await CourseAssignment.findOne({
        operatorId: operator._id,
        courseId: pack.courseId,
        workerId,
      });
      if (seat) return { seat, assignment };
    }
    throw error;
  } finally {
    await dbSession.endSession();
  }
  if (!result) throw new HttpError(500, 'Could not assign course seat');
  return result;
}

async function fulfillCheckout(session: Stripe.Checkout.Session) {
  const dbSession = await mongoose.startSession();
  try {
    await dbSession.withTransaction(async () => {
      const paymentId = session.metadata?.paymentId;
      const payment = await Payment.findOne({
        $or: [
          { stripeCheckoutSessionId: session.id },
          ...(paymentId && isValidObjectId(paymentId) ? [{ _id: paymentId }] : []),
        ],
      }).session(dbSession);
      if (!payment) throw new HttpError(404, 'Payment not found');
      if (
        session.amount_total !== payment.amountCents ||
        session.currency?.toLowerCase() !== payment.currency
      ) {
        throw new HttpError(400, 'Checkout total does not match payment');
      }
      const paymentIntentId =
        typeof session.payment_intent === 'string'
          ? session.payment_intent
          : session.payment_intent?.id;
      payment.status = 'paid';
      payment.paidAt ??= new Date();
      payment.stripeCheckoutSessionId = session.id;
      if (paymentIntentId) payment.stripePaymentIntentId = paymentIntentId;
      payment.failureReason = '';
      await payment.save({ session: dbSession });

      await CourseAccessPack.findOneAndUpdate(
        { paymentId: payment._id },
        {
          $setOnInsert: {
            operatorId: payment.operatorId,
            courseId: payment.courseId,
            quantity: payment.quantity,
            assignedCount: 0,
            status: 'active',
          },
        },
        { upsert: true, new: true, session: dbSession, runValidators: true },
      );
    });
  } finally {
    await dbSession.endSession();
  }
}

export async function handleStripeEvent(event: Stripe.Event): Promise<void> {
  if (
    event.type === 'checkout.session.completed' ||
    event.type === 'checkout.session.async_payment_succeeded'
  ) {
    const session = event.data.object;
    if (session.payment_status === 'paid') await fulfillCheckout(session);
    return;
  }
  if (
    event.type === 'checkout.session.async_payment_failed' ||
    event.type === 'checkout.session.expired'
  ) {
    const session = event.data.object;
    const paymentId = session.metadata?.paymentId;
    await Payment.updateOne(
      {
        status: 'pending',
        $or: [
          { stripeCheckoutSessionId: session.id },
          ...(paymentId && isValidObjectId(paymentId) ? [{ _id: paymentId }] : []),
        ],
      },
      {
        $set: {
          stripeCheckoutSessionId: session.id,
          status: event.type === 'checkout.session.expired' ? 'expired' : 'failed',
          failureReason:
            event.type === 'checkout.session.expired'
              ? 'Stripe checkout expired'
              : 'Stripe asynchronous payment failed',
        },
      },
    );
  }
}

export function constructStripeEvent(payload: Buffer, signature: string): Stripe.Event {
  if (!env.STRIPE_WEBHOOK_SECRET || !env.STRIPE_SECRET_KEY) {
    throw new HttpError(503, 'Stripe webhooks are not configured');
  }
  try {
    return stripe().webhooks.constructEvent(payload, signature, env.STRIPE_WEBHOOK_SECRET);
  } catch {
    throw new HttpError(400, 'Invalid Stripe webhook signature');
  }
}
