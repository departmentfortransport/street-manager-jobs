import * as sinon from 'sinon'

export const TRX: any = {
  commit: sinon.stub(),
  rollback: sinon.spy()
}

export const KNEX: any = {
  transaction: sinon.stub().yields(TRX)
}
