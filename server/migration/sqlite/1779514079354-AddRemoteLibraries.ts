import type { MigrationInterface, QueryRunner } from 'typeorm';

export class AddRemoteLibraries1779514079354 implements MigrationInterface {
  name = 'AddRemoteLibraries1779514079354';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "remote_library" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "name" varchar NOT NULL, "type" varchar NOT NULL, "hostname" varchar NOT NULL, "port" integer NOT NULL, "useSsl" boolean NOT NULL DEFAULT (0), "baseUrl" varchar, "apiKey" varchar, "plexToken" varchar, "isEnabled" boolean NOT NULL DEFAULT (1), "syncEnabled" boolean NOT NULL DEFAULT (1), "lastSyncAt" datetime, "createdAt" datetime NOT NULL DEFAULT (datetime('now')), "updatedAt" datetime NOT NULL DEFAULT (datetime('now')))`
    );
    await queryRunner.query(
      `CREATE TABLE "remote_media" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "status" integer NOT NULL DEFAULT (1), "remoteId" varchar, "createdAt" datetime NOT NULL DEFAULT (datetime('now')), "updatedAt" datetime NOT NULL DEFAULT (datetime('now')), "mediaId" integer, "remoteLibraryId" integer, CONSTRAINT "UQ_remote_media_library" UNIQUE ("mediaId", "remoteLibraryId"), CONSTRAINT "FK_remote_media_media" FOREIGN KEY ("mediaId") REFERENCES "media" ("id") ON DELETE CASCADE ON UPDATE NO ACTION, CONSTRAINT "FK_remote_media_remote_library" FOREIGN KEY ("remoteLibraryId") REFERENCES "remote_library" ("id") ON DELETE CASCADE ON UPDATE NO ACTION)`
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_remote_media_media" ON "remote_media" ("mediaId")`
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_remote_media_library" ON "remote_media" ("remoteLibraryId")`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "IDX_remote_media_library"`);
    await queryRunner.query(`DROP INDEX "IDX_remote_media_media"`);
    await queryRunner.query(`DROP TABLE "remote_media"`);
    await queryRunner.query(`DROP TABLE "remote_library"`);
  }
}
