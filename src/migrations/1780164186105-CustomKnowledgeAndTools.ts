import { MigrationInterface, QueryRunner } from "typeorm";

export class CustomKnowledgeAndTools1780164186105 implements MigrationInterface {
    name = 'CustomKnowledgeAndTools1780164186105'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "chatbot_configs" ADD "systemKnowledge" text`);
        await queryRunner.query(`ALTER TABLE "chatbot_configs" ADD "webhookUrl" character varying`);
        await queryRunner.query(`ALTER TABLE "chatbot_configs" ADD "allowedActions" jsonb`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "chatbot_configs" DROP COLUMN "allowedActions"`);
        await queryRunner.query(`ALTER TABLE "chatbot_configs" DROP COLUMN "webhookUrl"`);
        await queryRunner.query(`ALTER TABLE "chatbot_configs" DROP COLUMN "systemKnowledge"`);
    }

}
