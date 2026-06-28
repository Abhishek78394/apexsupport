import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, Index } from 'typeorm';
import { Organization } from '../../organization/entities/organization.entity';
import { User } from '../../user/entities/user.entity';
import { ChatbotConfig } from '../../chatbot/entities/chatbot-config.entity';

export enum ConversationStatus {
  OPEN = 'Open',
  RESOLVED = 'Resolved',
  ESCALATED = 'Escalated',
}

@Entity('conversations')
export class Conversation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ type: 'uuid' })
  organizationId: string;

  @ManyToOne(() => Organization, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'organizationId' })
  organization: Organization;

  @Index()
  @Column({ type: 'uuid' })
  chatbotId: string;

  @ManyToOne(() => ChatbotConfig, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'chatbotId' })
  chatbot: ChatbotConfig;

  @Index()
  @Column({ type: 'uuid', nullable: true })
  assignedAgentId: string;

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'assignedAgentId' })
  assignedAgent: User;

  @Index()
  @Column({ type: 'enum', enum: ConversationStatus, default: ConversationStatus.OPEN })
  status: ConversationStatus;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, unknown>;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
