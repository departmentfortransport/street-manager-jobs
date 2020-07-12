import * as Knex from 'knex'
import { injectable } from 'inversify'

@injectable()
export abstract class TransactionService {

  protected constructor(private knex: Knex) {}

  protected startTransaction(): Promise<Knex.Transaction> {
    return new Promise<Knex.Transaction>(resolve => this.knex.transaction((trx: Knex.Transaction) => resolve(trx)))
  }

  protected async finishTransaction(trx: Knex.Transaction): Promise<void> {
    await trx.commit()
  }

  protected async rollbackTransaction(trx: Knex.Transaction, error?: Error): Promise<void> {
    await trx.rollback(error)
  }
}
