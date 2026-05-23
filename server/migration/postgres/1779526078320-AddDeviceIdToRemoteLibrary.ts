import type { MigrationInterface, QueryRunner } from 'typeorm';

export class AddDeviceIdToRemoteLibrary1779526078320 implements MigrationInterface {
  name = 'AddDeviceIdToRemoteLibrary1779526078320';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "remote_library" ADD COLUMN "deviceId" character varying`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "remote_library" DROP COLUMN "deviceId"`
    );
  }
}
