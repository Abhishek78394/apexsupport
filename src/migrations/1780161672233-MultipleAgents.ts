import { MigrationInterface, QueryRunner } from "typeorm";

export class MultipleAgents1780161672233 implements MigrationInterface {
    name = 'MultipleAgents1780161672233'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "public"."IDX_fe5b62676f52a6d05f147c49c8"`);
        await queryRunner.query(`CREATE TYPE "public"."chatbot_configs_agenttype_enum" AS ENUM('Text Chatbot', 'Voice Agent')`);
        await queryRunner.query(`ALTER TABLE "chatbot_configs" ADD "agentType" "public"."chatbot_configs_agenttype_enum" NOT NULL DEFAULT 'Text Chatbot'`);
        await queryRunner.query(`ALTER TYPE "public"."users_role_enum" RENAME TO "users_role_enum_old"`);
        await queryRunner.query(`CREATE TYPE "public"."users_role_enum" AS ENUM('SUPER_ADMIN', 'TENANT')`);
        await queryRunner.query(`ALTER TABLE "users" ALTER COLUMN "role" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "users" ALTER COLUMN "role" TYPE "public"."users_role_enum" USING (CASE WHEN "role"::text = 'TENANT_ADMIN' OR "role"::text = 'CUSTOM_USER' THEN 'TENANT' ELSE "role"::text END)::"public"."users_role_enum"`);
        await queryRunner.query(`ALTER TABLE "users" ALTER COLUMN "role" SET DEFAULT 'TENANT'`);
        await queryRunner.query(`DROP TYPE "public"."users_role_enum_old"`);
        await queryRunner.query(`ALTER TABLE "chatbot_configs" DROP CONSTRAINT "FK_fe5b62676f52a6d05f147c49c86"`);
        await queryRunner.query(`ALTER TABLE "chatbot_configs" DROP CONSTRAINT "REL_fe5b62676f52a6d05f147c49c8"`);
        await queryRunner.query(`CREATE INDEX "IDX_fe5b62676f52a6d05f147c49c8" ON "chatbot_configs"  ("organizationId") `);
        await queryRunner.query(`ALTER TABLE "chatbot_configs" ADD CONSTRAINT "FK_fe5b62676f52a6d05f147c49c86" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "chatbot_configs" DROP CONSTRAINT "FK_fe5b62676f52a6d05f147c49c86"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_fe5b62676f52a6d05f147c49c8"`);
        await queryRunner.query(`ALTER TABLE "chatbot_configs" ADD CONSTRAINT "REL_fe5b62676f52a6d05f147c49c8" UNIQUE ("organizationId")`);
        await queryRunner.query(`ALTER TABLE "chatbot_configs" ADD CONSTRAINT "FK_fe5b62676f52a6d05f147c49c86" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`CREATE TYPE "public"."users_role_enum_old" AS ENUM('SUPER_ADMIN', 'TENANT_ADMIN', 'CUSTOM_USER')`);
        await queryRunner.query(`ALTER TABLE "users" ALTER COLUMN "role" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "users" ALTER COLUMN "role" TYPE "public"."users_role_enum_old" USING "role"::"text"::"public"."users_role_enum_old"`);
        await queryRunner.query(`ALTER TABLE "users" ALTER COLUMN "role" SET DEFAULT 'CUSTOM_USER'`);
        await queryRunner.query(`DROP TYPE "public"."users_role_enum"`);
        await queryRunner.query(`ALTER TYPE "public"."users_role_enum_old" RENAME TO "users_role_enum"`);
        await queryRunner.query(`ALTER TABLE "chatbot_configs" DROP COLUMN "agentType"`);
        await queryRunner.query(`DROP TYPE "public"."chatbot_configs_agenttype_enum"`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_fe5b62676f52a6d05f147c49c8" ON "chatbot_configs" USING btree ("organizationId") `);
    }

}
