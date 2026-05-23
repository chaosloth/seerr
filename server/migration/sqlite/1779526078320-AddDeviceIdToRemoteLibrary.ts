import type { MigrationInterface, QueryRunner } from 'typeorm';

export class AddDeviceIdToRemoteLibrary1779526078320 implements MigrationInterface {
  name = 'AddDeviceIdToRemoteLibrary1779526078320';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "remote_library" ADD COLUMN "deviceId" varchar`
    );
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public async down(queryRunner: QueryRunner): Promise<void> {
    // SQLite does not support DROP COLUMN
  }
}
