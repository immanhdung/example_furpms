import { Schema } from 'mongoose';

export const auditPlugin = (schema: Schema): void => {
  schema.add({
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    isDeleted: { type: Boolean, default: false },
    deletedAt: { type: Date, default: null },
    deletedBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
  });

  schema.set('timestamps', true);
};

export const softDeletePlugin = (schema: Schema): void => {
  schema.methods.softDelete = function (userId?: string) {
    this.isDeleted = true;
    this.deletedAt = new Date();
    if (userId) this.deletedBy = userId;
    return this.save();
  };

  schema.statics.findActive = function (filter: Record<string, unknown> = {}) {
    return this.find({ ...filter, isDeleted: false });
  };
};
