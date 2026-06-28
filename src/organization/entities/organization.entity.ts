import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export enum IndustryType {
  ECOMMERCE = 'Ecommerce',
  HEALTHCARE = 'Healthcare',
  REAL_ESTATE = 'Real Estate',
  SAAS = 'SaaS',
  OTHER = 'Other',
}

export type OrganizationDocument = HydratedDocument<Organization>;

@Schema({ timestamps: true, collection: 'organizations' })
export class Organization {
  createdAt?: Date;
  updatedAt?: Date;

  @Prop({ required: true, maxlength: 100 })
  name: string;

  @Prop({ required: true, unique: true, maxlength: 100 })
  slug: string;

  @Prop({ type: String, enum: IndustryType, default: IndustryType.OTHER })
  industry: IndustryType;

  @Prop()
  companySize?: string;

  @Prop()
  websiteUrl?: string;

  @Prop()
  address?: string;

  @Prop({ type: String, ref: 'User', required: true, index: true })
  ownerId: string;
}

export const OrganizationSchema = SchemaFactory.createForClass(Organization);

OrganizationSchema.index({ name: 1 });
