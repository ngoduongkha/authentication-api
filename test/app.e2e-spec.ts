import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { AppModule } from './../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { AuthDto } from 'src/auth/dto';
import * as pactum from 'pactum';
import { EditUserDto } from 'src/user/dto';

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
      it('should throw if email empty', () => {
        return pactum
          .spec()
          .post('/auth/signup')
          .withBody({ password: dto.password })
          .expectStatus(400);
      });
      it('should throw if body empty', () => {
        return pactum.spec().post('/auth/signup').expectStatus(400);
      });
      it('should signup', async () => {
        return pactum
          .spec()
          .post('/auth/signup')
          .withBody(dto)
          .expectStatus(201);
      });
    });
    describe('Signin', () => {
      it('should signin', async () => {
        return pactum
          .spec()
          .post('/auth/signin')
          .withBody(dto)
          .expectStatus(200)
          .stores('userAt', 'token');
      });
    });
  });

  describe('User', () => {
    it('should get current user', () => {
      return pactum
        .spec()
        .get('/users/me')
        .withHeaders({ Authorization: 'Bearer $S{userAt}' })
        .expectStatus(200);
    });

    it('should update user info', () => {
      const dto: EditUserDto = {
        email: 'baz@foo.com',
        firstName: 'baz',
        lastName: 'foo',
      };
      return pactum
        .spec()
        .patch('/users')
        .withHeaders({ Authorization: 'Bearer $S{userAt}' })
        .withBody(dto)
        .expectStatus(200)
        .expectBodyContains(dto.email)
        .expectBodyContains(dto.firstName)
        .expectBodyContains(dto.lastName);
    });
  });

  afterAll(async () => {
    await app.close();
  });
});
