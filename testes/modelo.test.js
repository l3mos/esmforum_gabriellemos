const bd = require('../bd/bd_utils.js');
const modelo = require('../modelo.js');

beforeEach(() => {
  bd.reconfig('./bd/esmforum-teste.db');
  // limpa dados de todas as tabelas
  bd.exec('delete from perguntas', []);
  bd.exec('delete from respostas', []);
});

test('Testando banco de dados vazio', () => {
  expect(modelo.listar_perguntas().length).toBe(0);
});

test('Testando cadastro de três perguntas', () => {
  modelo.cadastrar_pergunta('1 + 1 = ?');
  modelo.cadastrar_pergunta('2 + 2 = ?');
  modelo.cadastrar_pergunta('3 + 3 = ?');
  const perguntas = modelo.listar_perguntas(); 
  expect(perguntas.length).toBe(3);
  expect(perguntas[0].texto).toBe('1 + 1 = ?');
  expect(perguntas[1].texto).toBe('2 + 2 = ?');
  expect(perguntas[2].texto).toBe('3 + 3 = ?');
  expect(perguntas[2].num_respostas).toBe(0);
  expect(perguntas[1].id_pergunta).toBe(perguntas[2].id_pergunta - 1);
});

test('Testando listar três perguntas', () => {
  const mock_bd = {
    queryAll: jest.fn().mockReturnValue([
      { "id_pergunta": 1, "texto": "Qual a capital de MG?", "id_usuario": 1 },
      { "id_pergunta": 2, "texto": "Qual a capital de RJ?", "id_usuario": 1 },
      { "id_pergunta": 3, "texto": "Qual a capital de SP?", "id_usuario": 1 }
    ]),
    query: jest.fn()
      .mockReturnValueOnce({ 'count(*)': 5 })
      .mockReturnValueOnce({ 'count(*)': 10 })
      .mockReturnValueOnce({ 'count(*)': 15 })
  };
  modelo.reconfig_bd(mock_bd);

  const perguntas = modelo.listar_perguntas();
  expect(perguntas.length).toBe(3);
  expect(perguntas[0].texto).toBe('Qual a capital de MG?');
  expect(perguntas[1].texto).toBe('Qual a capital de RJ?');
  expect(perguntas[2].texto).toBe('Qual a capital de SP?');
  expect(perguntas[0].num_respostas).toBe(5);
  expect(perguntas[1].num_respostas).toBe(10);
  expect(perguntas[2].num_respostas).toBe(15);
});

test('Testando cadastro e listagem de respostas', () => {
  const mock_bd = {
    queryAll: jest.fn().mockImplementation((sql) => {
      if (sql.includes('from perguntas')) {
        return [{ "id_pergunta": 1, "texto": "1 + 1 = ?", "id_usuario": 1 }];
      }
      if (sql.includes('from respostas')) {
        return [
          { "id_resposta": 1, "texto": "2", "id_pergunta": 1 },
          { "id_resposta": 2, "texto": "II", "id_pergunta": 1 }
        ];
      }
      return [];
    }),
    query: jest.fn().mockReturnValue([{ 'count(*)': 2 }]),
    exec: jest.fn().mockReturnValue({ lastInsertRowid: 1 }),
    insert: jest.fn().mockReturnValue({ lastInsertRowid: 1 })
  };
  modelo.reconfig_bd(mock_bd);

  modelo.cadastrar_pergunta('1 + 1 = ?');
  const perguntas = modelo.listar_perguntas();
  const id_pergunta = perguntas[0].id_pergunta;

  modelo.cadastrar_resposta(id_pergunta, '2');
  modelo.cadastrar_resposta(id_pergunta, 'II');
  const respostas = modelo.get_respostas(id_pergunta);
  expect(respostas.length).toBe(2);
  expect(respostas[0].texto).toBe('2');
  expect(respostas[1].texto).toBe('II');
});

test('Testando obter pergunta por ID', () => {
  const mock_bd = {
    queryAll: jest.fn().mockReturnValue([]),
    query: jest.fn().mockImplementation((sql, params) => {
      if (sql.includes('from perguntas')) {
        return { "id_pergunta": params[0], "texto": "1 + 1 = ?", "id_usuario": 1 };
      }
      return { 'count(*)': 0 };
    }),
    exec: jest.fn().mockReturnValue({ lastInsertRowid: 1 }),
    insert: jest.fn().mockReturnValue({ lastInsertRowid: 1 })
  };
  modelo.reconfig_bd(mock_bd);

  const id_pergunta = modelo.cadastrar_pergunta('1 + 1 = ?');
  const pergunta = modelo.get_pergunta(id_pergunta);
  expect(pergunta.texto).toBe('1 + 1 = ?');
});

