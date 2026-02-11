import { Body, Controller, Post, Headers, Res } from '@nestjs/common';
import { PaymentService } from './payment.service';
import { ProcessPaymentDto } from './dto/process-payment.dto';
import { IdempotencyService } from 'src/idempotency/idempotency.service';

@Controller()
export class PaymentController {
  constructor(
    private readonly PaymentService: PaymentService,
    private readonly IdempotencyService: IdempotencyService,
  ) {}

  @Post('/process-payment')
  async processPayment(
    @Headers('Idempotency-Key') IdempotencyKey: string,
    @Body() body: ProcessPaymentDto,
  ) {
    const response = await this.PaymentService.processPayment(
      body.amount,
      body.currency,
    );
    if (IdempotencyKey) {
        await this.IdempotencyService.complete(IdempotencyKey, response)
    }
    return response;
  }
}
