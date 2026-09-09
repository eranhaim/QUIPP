import { isValidObjectId } from 'mongoose';
import { Course } from '../models/Course.js';
import { HttpError } from '../middleware/errorHandler.js';
import {
  type AdminCourse,
  type RawCourse,
  toAdminCourse,
} from './course.service.js';

function assertCourseId(id: string): void {
  if (!isValidObjectId(id)) throw new HttpError(400, 'Invalid course id');
}

export async function listCourseReviews(): Promise<AdminCourse[]> {
  const courses = await Course.find({
    ownerType: 'operator',
    reviewStatus: 'submitted',
  })
    .sort({ updatedAt: 1 })
    .lean();
  return courses.map((course) => toAdminCourse(course as unknown as RawCourse));
}

export async function approveCourseReview(
  reviewerUserId: string,
  courseId: string,
): Promise<AdminCourse> {
  assertCourseId(courseId);
  const course = await Course.findOneAndUpdate(
    {
      _id: courseId,
      ownerType: 'operator',
      reviewStatus: 'submitted',
      status: 'submitted',
    },
    {
      $set: {
        status: 'published',
        reviewStatus: 'approved',
        reviewNotes: '',
        reviewedBy: reviewerUserId,
        reviewedAt: new Date(),
      },
      $inc: { approvedVersion: 1 },
    },
    { new: true, runValidators: true },
  );
  if (!course) throw new HttpError(404, 'Submitted operator course not found');
  return toAdminCourse(course.toObject() as unknown as RawCourse);
}

export async function requestCourseReviewChanges(
  reviewerUserId: string,
  courseId: string,
  notes: string,
): Promise<AdminCourse> {
  assertCourseId(courseId);
  const course = await Course.findOneAndUpdate(
    {
      _id: courseId,
      ownerType: 'operator',
      reviewStatus: 'submitted',
      status: 'submitted',
    },
    {
      $set: {
        status: 'changes_requested',
        reviewStatus: 'changes_requested',
        reviewNotes: notes,
        reviewedBy: reviewerUserId,
        reviewedAt: new Date(),
      },
    },
    { new: true, runValidators: true },
  );
  if (!course) throw new HttpError(404, 'Submitted operator course not found');
  return toAdminCourse(course.toObject() as unknown as RawCourse);
}
