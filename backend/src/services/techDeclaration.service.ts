import { WorkerTechDeclaration } from '../models/WorkerTechDeclaration.js';
import { TAG_NAMES, type TagName } from '../models/TechnologyTag.js';
import { HttpError } from '../middleware/errorHandler.js';

export interface PublicTechDeclaration {
  id: string;
  equipmentName: string;
  brand: string | null;
  tagName: TagName | null;
  verified: boolean;
  declaredAt: string;
}

function toPublic(d: {
  _id: unknown;
  equipmentName: string;
  brand: string | null;
  tagName: TagName | null;
  verified: boolean;
  declaredAt: Date;
}): PublicTechDeclaration {
  return {
    id: String(d._id),
    equipmentName: d.equipmentName,
    brand: d.brand,
    tagName: d.tagName,
    verified: d.verified,
    declaredAt: d.declaredAt.toISOString(),
  };
}

export async function listMyDeclarations(userId: string): Promise<PublicTechDeclaration[]> {
  const docs = await WorkerTechDeclaration.find({ userId }).sort({ declaredAt: -1 });
  return docs.map((d) => toPublic(d.toObject() as never));
}

export interface DeclareInput {
  equipmentName: string;
  brand?: string | null;
  tagName?: TagName | null;
}

export async function declareEquipment(
  userId: string,
  input: DeclareInput,
): Promise<PublicTechDeclaration> {
  const equipmentName = input.equipmentName.trim();
  if (!equipmentName) throw new HttpError(400, 'equipmentName is required');
  if (input.tagName && !TAG_NAMES.includes(input.tagName)) {
    throw new HttpError(400, 'Invalid tagName');
  }
  const doc = await WorkerTechDeclaration.findOneAndUpdate(
    { userId, equipmentName },
    {
      $setOnInsert: {
        userId,
        equipmentName,
        declaredAt: new Date(),
      },
      $set: {
        brand: input.brand ?? null,
        tagName: input.tagName ?? null,
      },
    },
    { upsert: true, new: true },
  );
  return toPublic(doc.toObject() as never);
}

export async function bulkDeclare(
  userId: string,
  equipmentNames: string[],
): Promise<PublicTechDeclaration[]> {
  const clean = Array.from(new Set(equipmentNames.map((n) => n.trim()).filter(Boolean)));
  if (clean.length === 0) return [];
  await Promise.all(clean.map((equipmentName) => declareEquipment(userId, { equipmentName })));
  return listMyDeclarations(userId);
}

export async function removeDeclaration(userId: string, id: string): Promise<void> {
  const result = await WorkerTechDeclaration.deleteOne({ _id: id, userId });
  if (result.deletedCount === 0) throw new HttpError(404, 'Declaration not found');
}
