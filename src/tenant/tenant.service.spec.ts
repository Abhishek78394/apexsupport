import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { TenantService } from './tenant.service';
import { User } from '../user/entities/user.entity';
import { Organization } from '../organization/entities/organization.entity';

describe('TenantService', () => {
  let service: TenantService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TenantService,
        { provide: getModelToken(User.name), useValue: {} },
        { provide: getModelToken(Organization.name), useValue: {} },
      ],
    }).compile();

    service = module.get<TenantService>(TenantService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
