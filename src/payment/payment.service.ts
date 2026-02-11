import { Injectable } from '@nestjs/common';

@Injectable()
export class PaymentService {
    async processPayment(amount: number, currency: string){
        await new Promise(_ => setTimeout(_, 2000))
        return {message: `Charged ${amount} ${currency}`}
    }
}
