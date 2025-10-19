import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { UpdateUserDto, User, UserCreateDto } from './user.model';
import { nullify } from '../common/helpers/db-fields.helper';

@Injectable()
export class UserService {
  constructor(private readonly dbService: DatabaseService) {}

  async getAll(): Promise<User[]> {
    const sql = this.dbService.connection;

    const items = await sql<User[]>`
      SELECT id, name, first_name, last_name, email, avatar_url, role
      FROM users`;

    return items;
  }

  async getById(id: string): Promise<User | undefined> {
    const sql = this.dbService.connection;

    const items = await sql<User[]>`
      SELECT * 
      FROM users
      WHERE id = ${id}`;

    return items.at(0);
  }

  async findByEmail(email: string): Promise<User | undefined> {
    const sql = this.dbService.connection;

    const items = await sql<User[]>`
      SELECT *
      FROM users
      WHERE LOWER(email) = LOWER(${email})`;

    return items.at(0);
  }

  async create(createDto: UserCreateDto): Promise<User | undefined> {
    const { name, firstName, lastName, email, avatarUrl } = createDto;
    const sql = this.dbService.connection;
    const userId = crypto.randomUUID();

    await sql`
      INSERT INTO users (id, name, first_name, last_name, email, avatar_url)
      VALUES (${userId}, ${name}, ${firstName}, ${lastName}, LOWER(${email}), ${nullify(avatarUrl)});
    `;

    return { id: userId, name, firstName, lastName, email, avatarUrl } as User;
  }

  async update(id: string, updateDto: UpdateUserDto): Promise<User | undefined> {
    const { name, firstName, lastName, email, avatarUrl, role } = updateDto;
    const sql = this.dbService.connection;

    const items = await sql<User[]>`
      UPDATE
        users
      SET name       = ${name},
          first_name = ${firstName},
          last_name  = ${lastName},
          email      = ${email},
          avatar_url = ${nullify(avatarUrl)},
          role       = ${nullify(role)},
          updated_at = NOW()
      WHERE id = ${id}
      RETURNING *;`;

    return items.at(0) as User;
  }

  async delete(id: string): Promise<boolean> {
    const sql = this.dbService.connection;

    const result = await sql`
      DELETE
      FROM users
      WHERE id = ${id}`;

    return result.count > 0;
  }
}
