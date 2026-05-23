import type { MigrationInterface, QueryRunner } from 'typeorm';

export class AddRemoteLibraries1779514079354 implements MigrationInterface {
  name = 'AddRemoteLibraries1779514079354';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "remote_library" ("id" SERIAL NOT NULL, "name" character varying NOT NULL, "type" character varying NOT NULL, "hostname" character varying NOT NULL, "port" integer NOT NULL, "useSsl" boolean NOT NULL DEFAULT false, "baseUrl" character varying, "apiKey" character varying, "plexToken" character varying, "isEnabled" boolean NOT NULL DEFAULT true, "syncEnabled" boolean NOT NULL DEFAULT true, "lastSyncAt" TIMESTAMP, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_remote_library" PRIMARY KEY ("id"))`
    );
    await queryRunner.query(
      `CREATE TABLE "remote_media" ("id" SERIAL NOT NULL, "status" integer NOT NULL DEFAULT '1', "remoteId" character varying, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "mediaId" integer, "remoteLibraryId" integer, CONSTRAINT "UQ_remote_media_library" UNIQUE ("mediaId", "remoteLibraryId"), CONSTRAINT "PK_remote_media" PRIMARY KEY ("id"))`
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_remote_media_media" ON "remote_media" ("mediaId")`
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_remote_media_library" ON "remote_media" ("remoteLibraryId")`
    );
    await queryRunner.query(
      `ALTER TABLE "remote_media" ADD CONSTRAINT "FK_remote_media_media" FOREIGN KEY ("mediaId") REFERENCES "media"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "remote_media" ADD CONSTRAINT "FK_remote_media_remote_library" FOREIGN KEY ("remoteLibraryId") REFERENCES "remote_library"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "remote_media" DROP CONSTRAINT "FK_remote_media_remote_library"`
    );
    await queryRunner.query(
      `ALTER TABLE "remote_media" DROP CONSTRAINT "FK_remote_media_media"`
    );
    await queryRunner.query(`DROP INDEX "IDX_remote_media_library"`);
    await queryRunner.query(`DROP INDEX "IDX_remote_media_media"`);
    await queryRunner.query(`DROP TABLE "remote_media"`);
    await queryRunner.query(`DROP TABLE "remote_library"`);
  }
}
