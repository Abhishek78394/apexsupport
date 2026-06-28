import { MigrationInterface, QueryRunner } from "typeorm";

export class ConversationChatbotRelation1780162655567 implements MigrationInterface {
    name = 'ConversationChatbotRelation1780162655567'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "conversations" ADD "chatbotId" uuid NOT NULL`);
        await queryRunner.query(`CREATE INDEX "IDX_01ab654f197c64b6366ed40f13" ON "conversations"  ("chatbotId") `);
        await queryRunner.query(`ALTER TABLE "conversations" ADD CONSTRAINT "FK_01ab654f197c64b6366ed40f139" FOREIGN KEY ("chatbotId") REFERENCES "chatbot_configs"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "conversations" DROP CONSTRAINT "FK_01ab654f197c64b6366ed40f139"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_01ab654f197c64b6366ed40f13"`);
        await queryRunner.query(`ALTER TABLE "conversations" DROP COLUMN "chatbotId"`);
    }

}
