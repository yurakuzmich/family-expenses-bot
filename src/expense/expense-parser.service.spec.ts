import { Test, TestingModule } from '@nestjs/testing';
import { ExpenseParserService } from './expense-parser.service';

describe('ExpenseParserService', () => {
  let service: ExpenseParserService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ExpenseParserService],
    }).compile();
    service = module.get(ExpenseParserService);
  });

  it('parses description and trailing amount', () => {
    expect(service.parse('Сосиски 45000')).toEqual({
      expenseName: 'Сосиски 45000',
      amount: 150000,
    });
  });

  it('parses amount with spaces', () => {
    expect(service.parse('Кофе 1 500')).toEqual({
      expenseName: 'Кофе',
      amount: 1500,
    });
  });

  it('returns null when invalid', () => {
    expect(service.parse('no amount')).toBeNull();
  });
});
