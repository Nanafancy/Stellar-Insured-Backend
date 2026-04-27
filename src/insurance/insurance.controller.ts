import { Controller, Post, Param, Body, UseInterceptors } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { InsuranceService } from './insurance.service';
import { ClaimService } from './claim.service';
import { ReinsuranceService } from './reinsurance.service';
import { PurchasePolicyDto } from './dto/purchase-policy.dto';
import { CreateReinsuranceDto } from './dto/create-reinsurance.dto';
import { IdempotencyInterceptor } from '../interceptors/idempotency.interceptor';

@Controller({ path: 'insurance', version: '1' })
export class InsuranceController {
  constructor(
    private readonly insurance: InsuranceService,
    private readonly claims: ClaimService,
    private readonly reinsurance: ReinsuranceService,
  ) {}

  @Throttle({ default: { limit: 10, ttl: 3600000 } }) // 10 purchases per hour
  @Post('purchase')
  @UseInterceptors(IdempotencyInterceptor)
  async purchase(@Body() body: PurchasePolicyDto) {
    return this.insurance.purchasePolicy(body.userId, body.poolId, body.riskType, body.coverageAmount);
  }

  @Throttle({ default: { limit: 50, ttl: 3600000 } }) // 50 claim assessments per hour
  @Post('claims/:claimId/assess')
  @Throttle({ admin: { limit: 100, ttl: 60000 } }) // 100 assessments per minute for admins
  @UseInterceptors(IdempotencyInterceptor)
  async assessClaim(@Param('claimId') claimId: string) {
    return this.claims.assessClaim(claimId);
  }

  @Throttle({ default: { limit: 30, ttl: 3600000 } }) // 30 claim payments per hour
  @Post('claims/:claimId/pay')
  @Throttle({ admin: { limit: 50, ttl: 60000 } }) // 50 payouts per minute for admins
  @UseInterceptors(IdempotencyInterceptor)
  async payClaim(@Param('claimId') claimId: string) {
    return this.claims.payClaim(claimId);
  }

  @Throttle({ default: { limit: 5, ttl: 3600000 } }) // 5 reinsurance contracts per hour
  @Post('reinsurance')
  @Throttle({ admin: { limit: 20, ttl: 60000 } }) // 20 contracts per minute for admins
  @UseInterceptors(IdempotencyInterceptor)
  async createReinsurance(@Body() body: CreateReinsuranceDto) {
    return this.reinsurance.createContract(body.poolId, body.coverageLimit, body.premiumRate);
  }
}
