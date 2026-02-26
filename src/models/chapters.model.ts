import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IChapter extends Document {
  chName: string;
  subject: Types.ObjectId;    // ← back-reference to subject
  order: number;
  resources: Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

const chSchema = new Schema<IChapter>({
  chName: {
    type: String,
    required: true,
  },
  subject: {
    type: Schema.Types.ObjectId,
    ref: 'Subject',
    required: true          
  },
  order: {
    type: Number,
    default: 0
  },
  resources: [
    {
      type: Schema.Types.ObjectId,
      ref: 'Document'
    }
  ]
}, { timestamps: true });

export const Chapter = mongoose.model<IChapter>('Chapter', chSchema);
