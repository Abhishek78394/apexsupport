import { Controller, Get, Post, Body, Patch, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { TenantService } from './tenant.service';
import { RegisterTenantDto } from './dto/register-tenant.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Tenant & Organization Management')
@Controller('api/tenants')
export class TenantController {
  constructor(private readonly tenantService: TenantService) {}

  @Post('register')
  @ApiOperation({ summary: 'API 3: Self Register Tenant & Organization' })
  @ApiResponse({ status: 201, description: 'Tenant and Organization created successfully.' })
  register(@Body() dto: RegisterTenantDto) {
    return this.tenantService.register(dto, false);
  }

  @Post()
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'API 4: Create Tenant (Super Admin)' })
  createByAdmin(@Body() dto: RegisterTenantDto) {
    return this.tenantService.register(dto, true);
  }

  @Patch(':id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'API 5: Update Tenant Info' })
  update(@Param('id') id: string, @Body() updateData: any) {
    return this.tenantService.updateTenant(id, updateData);
  }

  @Patch(':id/suspend')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'API 6: Suspend Tenant' })
  suspend(@Param('id') id: string) {
    return this.tenantService.suspendTenant(id);
  }

  @Get()
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'API 10: Fetch all Tenants with Organizations' })
  findAll() {
    return this.tenantService.findAll();
  }

  @Get(':id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'API 11: Fetch single Tenant with Organizations' })
  findOne(@Param('id') id: string) {
    return this.tenantService.findOne(id);
  }
}
