import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, OneToMany, JoinColumn, Index } from 'typeorm';
import { User } from '../../user/entities/user.entity';
import { ChatbotConfig } from '../../chatbot/entities/chatbot-config.entity';
export enum IndustryType {
  ECOMMERCE = 'Ecommerce',
  HEALTHCARE = 'Healthcare',
  REAL_ESTATE = 'Real Estate',
  SAAS = 'SaaS',
  OTHER = 'Other',
}

@Entity('organizations')
export class Organization {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ length: 100 })
  name: string;

  @Index({ unique: true })
  @Column({ length: 100 })
  slug: string;

  @Column({ type: 'enum', enum: IndustryType, default: IndustryType.OTHER })
  industry: IndustryType;

  @Column({ nullable: true })
  companySize: string;

  @Column({ nullable: true })
  websiteUrl: string;

  @Column({ type: 'text', nullable: true })
  address: string;

  @ManyToOne(() => User, (user) => user.organizations, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'ownerId' })
  owner: User;

  @Index()
  @Column({ type: 'uuid' })
  ownerId: string;

  @OneToMany(() => ChatbotConfig, (agent) => agent.organization, { cascade: true })
  agents: ChatbotConfig[];

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
