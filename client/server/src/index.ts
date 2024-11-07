import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import pool from './db';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware para analisar o corpo da solicitação em JSON
app.use(express.json());

// Configuração de CORS
app.use(
  cors({
    origin: ['http://localhost:5173', 'http://10.100.22.40:5173'],
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true,
  })
);

// Função para gerar o token JWT
const generateToken = (userId: number) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET as string, { expiresIn: '1h' });
};

// Interface personalizada para incluir userId
interface CustomRequest extends Request {
  userId?: number;
}

// Middleware de autenticação
const authenticate = (req: CustomRequest, res: Response, next: NextFunction): void => {
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) {
    res.status(401).json({ message: 'Token não fornecido' });
    return;
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as { id: number };
    req.userId = decoded.id;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Token inválido' });
  }
};

// Rota de login
app.post('/api/login', async (req: Request, res: Response): Promise<void> => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400).json({ message: 'Email e senha são obrigatórios' });
    return;
  }

  try {
    const [rows]: any = await pool.query('SELECT id, password, cargo FROM users WHERE email = ?', [email]);
    const user = rows[0];

    if (!user) {
      res.status(404).json({ message: 'Usuário não encontrado' });
      return;
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      res.status(401).json({ message: 'Senha incorreta' });
      return;
    }

    const token = generateToken(user.id);
    res.json({ message: 'Login bem-sucedido', token, cargo: user.cargo });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erro no servidor' });
  }
});

app.get('/api/requests', authenticate, async (req: CustomRequest, res: Response) => {
  try {
    const [rows]: any = await pool.query('SELECT * FROM requests');
    
    // Log dos dados retornados do banco de dados para inspeção
    rows.forEach((request: any) => {
      console.log("Request ID:", request.id);
      console.log("Nota Fiscal:", request.notaFiscal);
      console.log("Nova Finalidade:", request.novaFinalidade);
      console.log("Atendeu Necessidade:", request.atendeuNecessidade);
    });

    res.status(200).json({ requests: rows });
  } catch (error) {
    console.error('Erro ao buscar os requests:', error);
    res.status(500).json({ message: 'Erro ao buscar os requests' });
  }
});



// Rota para atualizar Chamado ou Pedido
app.put('/api/request/:id', authenticate, async (req: CustomRequest, res: Response): Promise<void> => {
  const { id } = req.params;
  const { numeroChamado, numeroPedido } = req.body;
  const userId = req.userId;

  if (!userId) {
    res.status(401).json({ message: 'Usuário não autenticado' });
    return;
  }

  try {
    const [result]: any = await pool.query(
      'UPDATE requests SET numeroChamado = ?, numeroPedido = ? WHERE id = ? AND user_id = ?',
      [numeroChamado, numeroPedido, id, userId]
    );

    if (result.affectedRows === 0) {
      res.status(404).json({ message: 'Requisição não encontrada ou não pertence ao usuário' });
      return;
    }

    res.status(200).json({ message: 'Requisição atualizada com sucesso' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erro ao atualizar a requisição' });
  }
});

app.put('/api/request/:id/status', authenticate, async (req: CustomRequest, res: Response): Promise<void> => {
  const { id } = req.params;
  const { status, dataPrevista, notaFiscal, atendeuNecessidade, novaFinalidade } = req.body;
  const userId = req.userId;

  if (!userId) {
    res.status(401).json({ message: 'Usuário não autenticado' });
    return;
  }

  try {
    const [result]: any = await pool.query(
      'UPDATE requests SET status = ?, dataPrevista = ?, notaFiscal = ?, atendeuNecessidade = ?, novaFinalidade = ? WHERE id = ? AND user_id = ?',
      [status, dataPrevista || null, notaFiscal || null, atendeuNecessidade || null, novaFinalidade || null, id, userId]
    );

    if (result.affectedRows === 0) {
      res.status(404).json({ message: 'Requisição não encontrada ou não pertence ao usuário' });
      return;
    }

    res.status(200).json({ message: 'Status atualizado com sucesso' });
  } catch (error) {
    console.error('Erro ao atualizar o status da requisição:', error);
    res.status(500).json({ message: 'Erro ao atualizar o status da requisição' });
  }
});


// Rota de registro de usuário
app.post('/api/register', async (req: Request, res: Response): Promise<void> => {
  const { email, password, cargo } = req.body;

  if (!email || !password || !cargo) { // Valida que o cargo foi incluído
    res.status(400).json({ message: 'Email, senha e cargo são obrigatórios' });
    return;
  }

  try {
    const [existingUser]: any = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
    if (existingUser.length > 0) {
      res.status(400).json({ message: 'Email já está em uso' });
      return;
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const [result]: any = await pool.query(
      'INSERT INTO users (email, password, cargo) VALUES (?, ?, ?)',
      [email, hashedPassword, cargo]  // Inclui o cargo na query
    );

    const token = generateToken(result.insertId);
    res.status(201).json({ message: 'Usuário registrado com sucesso', token });
  } catch (error) {
    console.error('Erro ao registrar o usuário:', error);
    res.status(500).json({ message: 'Erro ao registrar o usuário' });
  }
});


// Rota para buscar o cargo do usuário
app.get('/api/user/cargo', authenticate, async (req: CustomRequest, res: Response) => {
  try {
    const [userRows]: any = await pool.query('SELECT cargo FROM users WHERE id = ?', [req.userId]);
    const cargo = userRows[0]?.cargo;
    if (!cargo) {
      res.status(404).json({ message: 'Cargo não encontrado' });
      return;
    }
    res.status(200).json({ cargo });
  } catch (error) {
    console.error('Erro ao buscar o cargo:', error);
    res.status(500).json({ message: 'Erro ao buscar o cargo do usuário' });
  }
});

// Rota para criar uma requisição de compra
app.post('/api/request', authenticate, async (req: CustomRequest, res: Response) => {
  const { unidade, setor, requerente, item, necessidade, prioridade } = req.body;
  const userId = req.userId;

  try {
    const [result]: any = await pool.query(
      'INSERT INTO requests (user_id, unidade, setor, requerente, item, necessidade, prioridade, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [userId, unidade, setor, requerente, item, necessidade, prioridade, 'Pendente']
    );
    res.status(201).json({ message: 'Requisição criada com sucesso', requestId: result.insertId });
  } catch (error) {
    console.error('Erro ao criar a requisição:', error);
    res.status(500).json({ message: 'Erro ao criar a requisição' });
  }
});

// Rota pública para dados da tabela
app.get('/api/data', (req: Request, res: Response) => {
  const data = [
    { id: 1, name: 'Item 1', description: 'Descrição do Item 1' },
    { id: 2, name: 'Item 2', description: 'Descrição do Item 2' },
    { id: 3, name: 'Item 3', description: 'Descrição do Item 3' },
  ];

  res.json(data);
});

// Rota para atualizar o Status ou outras informações
app.put('/api/request/:id/status', authenticate, async (req: CustomRequest, res: Response): Promise<void> => {
  const { id } = req.params;
  const { status, dataPrevista, notaFiscal, atendeuNecessidade, novaFinalidade } = req.body;
  const userId = req.userId;

  if (!userId) {
    res.status(401).json({ message: 'Usuário não autenticado' });
    return;
  }

  try {
    // Atualiza apenas os campos fornecidos
    const [result]: any = await pool.query(
      'UPDATE requests SET status = ?, dataPrevista = ?, notaFiscal = ?, atendeuNecessidade = ?, novaFinalidade = ? WHERE id = ?',
      [status, dataPrevista || null, notaFiscal || null, atendeuNecessidade || null, novaFinalidade || null, id]
    );

    if (result.affectedRows === 0) {
      res.status(404).json({ message: 'Requisição não encontrada ou não pertence ao usuário' });
      return;
    }

    res.status(200).json({ message: 'Status atualizado com sucesso' });
  } catch (error) {
    console.error('Erro ao atualizar o status da requisição:', error);
    res.status(500).json({ message: 'Erro ao atualizar o status da requisição' });
  }
});

// Rota para atualizar o número do chamado
app.put('/api/request/:id/chamado', authenticate, async (req: CustomRequest, res: Response) => {
  const { id } = req.params;
  const { numeroChamado } = req.body;
  const userId = req.userId;

  if (!userId) {
    res.status(401).json({ message: 'Usuário não autenticado' });
    return;
  }

  try {
    const [result]: any = await pool.query(
      'UPDATE requests SET numeroChamado = ? WHERE id = ?',
      [numeroChamado, id]
    );

    if (result.affectedRows === 0) {
      res.status(404).json({ message: 'Requisição não encontrada' });
      return;
    }

    res.status(200).json({ message: 'Número do chamado atualizado com sucesso' });
  } catch (error) {
    console.error('Erro ao atualizar o número do chamado:', error);
    res.status(500).json({ message: 'Erro ao atualizar o número do chamado' });
  }
});

// Rota para atualizar o número do pedido
app.put('/api/request/:id/pedido', authenticate, async (req: CustomRequest, res: Response) => {
  const { id } = req.params;
  const { numeroPedido } = req.body;
  const userId = req.userId;

  if (!userId) {
    res.status(401).json({ message: 'Usuário não autenticado' });
    return;
  }

  try {
    const [result]: any = await pool.query(
      'UPDATE requests SET numeroPedido = ? WHERE id = ?',
      [numeroPedido, id]
    );

    if (result.affectedRows === 0) {
      res.status(404).json({ message: 'Requisição não encontrada' });
      return;
    }

    res.status(200).json({ message: 'Número do pedido atualizado com sucesso' });
  } catch (error) {
    console.error('Erro ao atualizar o número do pedido:', error);
    res.status(500).json({ message: 'Erro ao atualizar o número do pedido' });
  }
});


// Inicializa o servidor
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});


// http://10.100.22.40:3001