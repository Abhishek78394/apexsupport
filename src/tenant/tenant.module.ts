import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { TenantService } from './tenant.service';
import { TenantController } from './tenant.controller';
import { User, UserSchema } from '../user/entities/user.entity';
import { Organization, OrganizationSchema } from '../organization/entities/organization.entity';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: Organization.name, schema: OrganizationSchema },
    ]),
  ],
  controllers: [TenantController],
  providers: [TenantService],
})
export class TenantModule {}
