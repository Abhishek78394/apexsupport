import { MigrationInterface, QueryRunner } from "typeorm";

export class InitDb1779988316241 implements MigrationInterface {
    name = 'InitDb1779988316241'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."users_role_enum" AS ENUM('SUPER_ADMIN', 'TENANT_ADMIN', 'CUSTOM_USER')`);
        await queryRunner.query(`CREATE TYPE "public"."users_status_enum" AS ENUM('Pending', 'Active', 'Suspended', 'Deactivated')`);
        await queryRunner.query(`CREATE TABLE "users" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "fullName" character varying(255), "email" character varying(255) NOT NULL, "phone" character varying(50), "passwordHash" character varying, "role" "public"."users_role_enum" NOT NULL DEFAULT 'CUSTOM_USER', "permissions" jsonb, "status" "public"."users_status_enum" NOT NULL DEFAULT 'Active', "otp" character varying, "otpExpiresAt" TIMESTAMP WITH TIME ZONE, "resetToken" character varying, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_97672ac88f789774dd47f7c8be" ON "users"  ("email") `);
        await queryRunner.query(`CREATE INDEX "IDX_ace513fa30d485cfd25c11a9e4" ON "users"  ("role") `);
        await queryRunner.query(`CREATE INDEX "IDX_3676155292d72c67cd4e090514" ON "users"  ("status") `);
        await queryRunner.query(`CREATE TYPE "public"."organizations_industry_enum" AS ENUM('Ecommerce', 'Healthcare', 'Real Estate', 'SaaS', 'Other')`);
        await queryRunner.query(`CREATE TABLE "organizations" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying(100) NOT NULL, "slug" character varying(100) NOT NULL, "industry" "public"."organizations_industry_enum" NOT NULL DEFAULT 'Other', "companySize" character varying, "websiteUrl" character varying, "address" text, "ownerId" uuid NOT NULL, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_6b031fcd0863e3f6b44230163f9" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_9b7ca6d30b94fef571cff87688" ON "organizations"  ("name") `);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_963693341bd612aa01ddf3a4b6" ON "organizations"  ("slug") `);
        await queryRunner.query(`CREATE INDEX "IDX_cdf778d13ea7fe8095e013e34f" ON "organizations"  ("ownerId") `);
        await queryRunner.query(`CREATE TYPE "public"."chatbot_configs_personality_enum" AS ENUM('Friendly', 'Formal', 'Professional')`);
        await queryRunner.query(`CREATE TABLE "chatbot_configs" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "organizationId" uuid NOT NULL, "name" character varying(100) NOT NULL, "personality" "public"."chatbot_configs_personality_enum" NOT NULL DEFAULT 'Professional', "logoUrl" character varying, "businessHours" jsonb, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "REL_fe5b62676f52a6d05f147c49c8" UNIQUE ("organizationId"), CONSTRAINT "PK_7042be24dfbbe98c533fdaaf33f" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_fe5b62676f52a6d05f147c49c8" ON "chatbot_configs"  ("organizationId") `);
        await queryRunner.query(`CREATE TABLE "chatbot_intents" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying(100) NOT NULL, "trainingPhrases" text array, "responseTemplate" jsonb, "organizationId" uuid NOT NULL, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_fe4ce2f266d5a7afa0670ed1cb9" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_e6b43f8c9addbdaf349443850f" ON "chatbot_intents"  ("organizationId") `);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_ba74ef670c583eedcf030cd83e" ON "chatbot_intents"  ("organizationId", "name") `);
        await queryRunner.query(`CREATE TYPE "public"."conversations_status_enum" AS ENUM('Open', 'Resolved', 'Escalated')`);
        await queryRunner.query(`CREATE TABLE "conversations" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "organizationId" uuid NOT NULL, "assignedAgentId" uuid, "status" "public"."conversations_status_enum" NOT NULL DEFAULT 'Open', "metadata" jsonb, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_ee34f4f7ced4ec8681f26bf04ef" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_dd02b2c7cad0901abc74f7ac71" ON "conversations"  ("organizationId") `);
        await queryRunner.query(`CREATE INDEX "IDX_694ee2d05b111db9c5d37ed9ff" ON "conversations"  ("assignedAgentId") `);
        await queryRunner.query(`CREATE INDEX "IDX_517acf7e04a7232adb0c760c4b" ON "conversations"  ("status") `);
        await queryRunner.query(`ALTER TABLE "organizations" ADD CONSTRAINT "FK_cdf778d13ea7fe8095e013e34f0" FOREIGN KEY ("ownerId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "chatbot_configs" ADD CONSTRAINT "FK_fe5b62676f52a6d05f147c49c86" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "chatbot_intents" ADD CONSTRAINT "FK_e6b43f8c9addbdaf349443850f9" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "conversations" ADD CONSTRAINT "FK_dd02b2c7cad0901abc74f7ac713" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "conversations" ADD CONSTRAINT "FK_694ee2d05b111db9c5d37ed9ff9" FOREIGN KEY ("assignedAgentId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "conversations" DROP CONSTRAINT "FK_694ee2d05b111db9c5d37ed9ff9"`);
        await queryRunner.query(`ALTER TABLE "conversations" DROP CONSTRAINT "FK_dd02b2c7cad0901abc74f7ac713"`);
        await queryRunner.query(`ALTER TABLE "chatbot_intents" DROP CONSTRAINT "FK_e6b43f8c9addbdaf349443850f9"`);
        await queryRunner.query(`ALTER TABLE "chatbot_configs" DROP CONSTRAINT "FK_fe5b62676f52a6d05f147c49c86"`);
        await queryRunner.query(`ALTER TABLE "organizations" DROP CONSTRAINT "FK_cdf778d13ea7fe8095e013e34f0"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_517acf7e04a7232adb0c760c4b"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_694ee2d05b111db9c5d37ed9ff"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_dd02b2c7cad0901abc74f7ac71"`);
        await queryRunner.query(`DROP TABLE "conversations"`);
        await queryRunner.query(`DROP TYPE "public"."conversations_status_enum"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_ba74ef670c583eedcf030cd83e"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_e6b43f8c9addbdaf349443850f"`);
        await queryRunner.query(`DROP TABLE "chatbot_intents"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_fe5b62676f52a6d05f147c49c8"`);
        await queryRunner.query(`DROP TABLE "chatbot_configs"`);
        await queryRunner.query(`DROP TYPE "public"."chatbot_configs_personality_enum"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_cdf778d13ea7fe8095e013e34f"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_963693341bd612aa01ddf3a4b6"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_9b7ca6d30b94fef571cff87688"`);
        await queryRunner.query(`DROP TABLE "organizations"`);
        await queryRunner.query(`DROP TYPE "public"."organizations_industry_enum"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_3676155292d72c67cd4e090514"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_ace513fa30d485cfd25c11a9e4"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_97672ac88f789774dd47f7c8be"`);
        await queryRunner.query(`DROP TABLE "users"`);
        await queryRunner.query(`DROP TYPE "public"."users_status_enum"`);
        await queryRunner.query(`DROP TYPE "public"."users_role_enum"`);
    }

}
