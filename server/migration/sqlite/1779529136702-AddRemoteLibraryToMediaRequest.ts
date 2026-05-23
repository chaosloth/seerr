import type { MigrationInterface, QueryRunner } from 'typeorm';

export class AddRemoteLibraryToMediaRequest1779529136702 implements MigrationInterface {
  name = 'AddRemoteLibraryToMediaRequest1779529136702';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "media_request" ADD COLUMN "remoteLibraryId" integer`
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_media_request_remote_library" ON "media_request" ("remoteLibraryId")`
    );
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public async down(queryRunner: QueryRunner): Promise<void> {
    // SQLite does not support DROP COLUMN
  }
}
