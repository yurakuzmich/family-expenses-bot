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
    expect(service.parse('Детское питание для Жени 150000')).toEqual({
      expenseName: 'Детское питание для Жени',
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

  it('parseLines handles multiple lines', () => {
    const text = 'Хлеб 10000\nМолоко 14000\nСпички 1200';
    expect(service.parseLines(text)).toEqual({
      items: [
        { expenseName: 'Хлеб', amount: 10000 },
        { expenseName: 'Молоко', amount: 14000 },
        { expenseName: 'Спички', amount: 1200 },
      ],
      invalidLines: [],
    });
  });

  it('parseLines skips empty lines and collects invalid', () => {
    const text = 'А 10\n\nbad line\nБ 20';
    expect(service.parseLines(text)).toEqual({
      items: [
        { expenseName: 'А', amount: 10 },
        { expenseName: 'Б', amount: 20 },
      ],
      invalidLines: ['bad line'],
    });
  });
});
