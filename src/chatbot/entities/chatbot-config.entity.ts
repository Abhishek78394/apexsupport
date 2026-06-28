import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, OneToMany, JoinColumn, Index } from 'typeorm';
import { Organization } from '../../organization/entities/organization.entity';
import { Conversation } from '../../conversation/entities/conversation.entity';

export enum BotPersonality {
  FRIENDLY = 'Friendly',
  FORMAL = 'Formal',
  PROFESSIONAL = 'Professional',
}

export enum AgentType {
  TEXT_CHATBOT = 'Text Chatbot',
  VOICE_AGENT = 'Voice Agent',
}

@Entity('chatbot_configs')
export class ChatbotConfig {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ type: 'uuid' })
  organizationId: string;

  @ManyToOne(() => Organization, (org) => org.agents, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'organizationId' })
  organization: Organization;

  @Column({ type: 'enum', enum: AgentType, default: AgentType.TEXT_CHATBOT })
  agentType: AgentType;

  @OneToMany(() => Conversation, (conv) => conv.chatbot, { cascade: true })
  conversations: Conversation[];

  @Column({ length: 100 })
  name: string;

  @Column({ type: 'enum', enum: BotPersonality, default: BotPersonality.PROFESSIONAL })
  personality: BotPersonality;

  @Column({ nullable: true })
  logoUrl: string;

  @Column({ type: 'jsonb', nullable: true })
  businessHours: Record<string, any>;

  @Column({ type: 'text', nullable: true })
  systemKnowledge: string;

  @Column({ nullable: true })
  webhookUrl: string;

  @Column({ type: 'jsonb', nullable: true })
  allowedActions: Record<string, any>[];

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
