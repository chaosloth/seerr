import type { MigrationInterface, QueryRunner } from 'typeorm';

export class AddRemoteLibraryToMediaRequest1779529136702 implements MigrationInterface {
  name = 'AddRemoteLibraryToMediaRequest1779529136702';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "media_request" ADD COLUMN "remoteLibraryId" integer`
    );
    await queryRunner.query(
      `ALTER TABLE "media_request" ADD CONSTRAINT "FK_media_request_remote_library" FOREIGN KEY ("remoteLibraryId") REFERENCES "remote_library"("id") ON DELETE SET NULL ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_media_request_remote_library" ON "media_request" ("remoteLibraryId")`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "IDX_media_request_remote_library"`);
    await queryRunner.query(
      `ALTER TABLE "media_request" DROP CONSTRAINT "FK_media_request_remote_library"`
    );
    await queryRunner.query(
      `ALTER TABLE "media_request" DROP COLUMN "remoteLibraryId"`
    );
  }
}
