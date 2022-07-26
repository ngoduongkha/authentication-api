import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { AppModule } from './../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { AuthDto } from 'src/auth/dto';
import * as pactum from 'pactum';
import { EditUserDto } from 'src/user/dto';
import { CreateNoteDto } from 'src/note/dto';
import { EditNoteDto } from 'src/note/dto/edit-note.dto';

describe('AppController (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
      }),
    );
    await app.init();
    await app.listen(3333);

    prisma = app.get(PrismaService);
    await prisma.cleanDb();

    pactum.request.setBaseUrl('http://localhost:3333');
  });

  describe('Auth', () => {
    const dto: AuthDto = {
      email: 'foo@baz.com',
      password: 'foobaz',
    };

    describe('Signup', () => {
      it('should throw if body not provided', () => {
        return pactum.spec().post('/auth/signup').expectStatus(400);
      });
      it('should throw if email empty', () => {
        return pactum
          .spec()
          .post('/auth/signup')
          .withBody({ password: dto.password })
          .expectStatus(400)
          .expectBodyContains('Email is not provided');
      });
      it('should throw if password empty', () => {
        return pactum
          .spec()
          .post('/auth/signup')
          .withBody({ email: dto.email })
          .expectStatus(400)
          .expectBodyContains('Password is not provided');
      });
      it('should throw if email not valid', () => {
        return pactum
          .spec()
          .post('/auth/signup')
          .withBody({ email: 'foobaz.com', password: '123456' })
          .expectStatus(400)
          .expectBodyContains('Email is not valid');
      });
      it('should signup', () => {
        return pactum
          .spec()
          .post('/auth/signup')
          .withBody(dto)
          .expectStatus(201);
      });
      it('should throw if email already taken', () => {
        return pactum
          .spec()
          .post('/auth/signup')
          .withBody(dto)
          .expectStatus(403);
      });
    });

    describe('Signin', () => {
      it('should throw if body not provided', () => {
        return pactum.spec().post('/auth/signin').expectStatus(400);
      });
      it('should throw if email empty', () => {
        return pactum
          .spec()
          .post('/auth/signin')
          .withBody({ password: dto.password })
          .expectStatus(400)
          .expectBodyContains('Email is not provided');
      });
      it('should throw if password empty', () => {
        return pactum
          .spec()
          .post('/auth/signin')
          .withBody({ email: dto.email })
          .expectStatus(400)
          .expectBodyContains('Password is not provided');
      });
      it('should throw if email not valid', () => {
        return pactum
          .spec()
          .post('/auth/signin')
          .withBody({ email: 'foobaz.com', password: dto.password })
          .expectStatus(400)
          .expectBodyContains('Email is not valid');
      });
      it('should throw if wrong email', () => {
        return pactum
          .spec()
          .post('/auth/signin')
          .withBody({ email: 'abc@mail.com', password: dto.password })
          .expectStatus(403)
          .expectBodyContains('Incorrect email or password');
      });
      it('should throw if wrong password', () => {
        return pactum
          .spec()
          .post('/auth/signin')
          .withBody({ email: dto.email, password: 'foobazzzz' })
          .expectStatus(403)
          .expectBodyContains('Incorrect email or password');
      });
      it('should signin', async () => {
        return pactum
          .spec()
          .post('/auth/signin')
          .withBody(dto)
          .expectStatus(200)
          .stores('accessToken', 'token');
      });
    });
  });

  describe('User', () => {
    describe('Get user info', () => {
      it('should throw if access token not provided', () => {
        return pactum.spec().get('/users/me').expectStatus(401);
      });
      it('should get current user', () => {
        return pactum
          .spec()
          .get('/users/me')
          .withHeaders({ Authorization: 'Bearer $S{accessToken}' })
          .expectStatus(200);
      });
    });

    describe('Update user info', () => {
      const dto: EditUserDto = {
        email: 'baz@foo.com',
        firstName: 'bar',
        lastName: 'foo',
      };
      it('should throw if access token not provided', () => {
        return pactum.spec().patch('/users').withBody(dto).expectStatus(401);
      });
      it('should update user info', () => {
        return pactum
          .spec()
          .patch('/users')
          .withHeaders({ Authorization: 'Bearer $S{accessToken}' })
          .withBody(dto)
          .expectStatus(200)
          .expectBodyContains(dto.email)
          .expectBodyContains(dto.firstName)
          .expectBodyContains(dto.lastName);
      });
    });
  });

  describe('Note Controller', () => {
    describe('Create note', () => {
      const dto: CreateNoteDto = {
        title: 'foo note',
        description: 'baz note',
      };
      it('should throw if body not provided', () => {
        return pactum
          .spec()
          .post('/notes')
          .withHeaders({ Authorization: 'Bearer $S{accessToken}' })
          .expectStatus(400);
      });
      it('should throw if note title not provided', () => {
        return pactum
          .spec()
          .post('/notes')
          .withHeaders({ Authorization: 'Bearer $S{accessToken}' })
          .withBody({ description: dto.description })
          .expectStatus(400)
          .expectBodyContains('title should not be empty');
      });
      it('should create new note', () => {
        return pactum
          .spec()
          .post('/notes')
          .withHeaders({ Authorization: 'Bearer $S{accessToken}' })
          .withBody(dto)
          .expectStatus(201)
          .stores('noteId', 'id');
      });
      it('should return note created', () => {
        return pactum
          .spec()
          .get('/notes/$S{noteId}')
          .withHeaders({ Authorization: 'Bearer $S{accessToken}' })
          .expectStatus(200)
          .expectBodyContains(dto.title)
          .expectBodyContains(dto.description);
      });
    });

    describe('Update note', () => {
      it('should update note', () => {
        const note: EditNoteDto = {
          title: 'new title',
          description: 'new description',
        };
        return pactum
          .spec()
          .patch('/notes/$S{noteId}')
          .withHeaders({ Authorization: 'Bearer $S{accessToken}' })
          .withBody(note)
          .expectStatus(200)
          .expectBodyContains(note.title)
          .expectBodyContains(note.description);
      });
    });

    describe('Delete note', () => {
      it('should delete note', () => {
        return pactum
          .spec()
          .delete('/notes/$S{noteId}')
          .withHeaders({ Authorization: 'Bearer $S{accessToken}' })
          .expectStatus(200);
      });
      it('should find nothing after deleted note', () => {
        return pactum
          .spec()
          .get('/notes/$S{noteId}')
          .withHeaders({ Authorization: 'Bearer $S{accessToken}' })
          .expectStatus(200)
          .expectBody('');
      });
    });

    describe('Create multiple notes', () => {
      const dto: CreateNoteDto = {
        title: 'foo note',
        description: 'baz note',
      };

      it('should create multiple notes', async () => {
        await pactum
          .spec()
          .post('/notes')
          .withHeaders({ Authorization: 'Bearer $S{accessToken}' })
          .withBody(dto)
          .expectStatus(201);
        await pactum
          .spec()
          .post('/notes')
          .withHeaders({ Authorization: 'Bearer $S{accessToken}' })
          .withBody(dto)
          .expectStatus(201);
        await pactum
          .spec()
          .post('/notes')
          .withHeaders({ Authorization: 'Bearer $S{accessToken}' })
          .withBody(dto)
          .expectStatus(201);
      });
      it('should return note created', () => {
        return pactum
          .spec()
          .get('/notes')
          .withHeaders({ Authorization: 'Bearer $S{accessToken}' })
          .expectStatus(200)
          .expectJsonLength(3);
      });
    });
  });

  afterAll(async () => {
    await app.close();
  });
});
