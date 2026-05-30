import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TenantService } from './tenant.service';
import { TenantController } from './tenant.controller';
import { User } from '../user/entities/user.entity';
import { Organization } from '../organization/entities/organization.entity';

@Module({
  imports: [TypeOrmModule.forFeature([User, Organization])],
  controllers: [TenantController],
  providers: [TenantService],
})
export class TenantModule {}
