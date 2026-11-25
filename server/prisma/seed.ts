import { createRequire } from 'node:module';
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const loadEnv = createRequire(__filename);
loadEnv('../env.cjs');

const prisma = new PrismaClient();

async function main() {
  if (process.env.SEED_DEMO !== 'true') {
    console.log('SEED_DEMO 未开启，跳过演示账号。');
    return;
  }
  const email = process.env.DEMO_EMAIL?.trim();
  const plainPassword = process.env.DEMO_PASSWORD;
  if (!email || !plainPassword) throw new Error('SEED_DEMO=true 时需要 DEMO_EMAIL 和 DEMO_PASSWORD');
  const password = await bcrypt.hash(plainPassword, 10);
  const user = await prisma.user.upsert({
    where: { email },
    update: {},
    create: { email, password, nickname: '阿乐' },
  });

  const existing = await prisma.note.count({ where: { userId: user.id } });
  if (existing > 0) {
    console.log('演示数据已存在，跳过填充。');
    return;
  }

  const life = await prisma.folder.create({
    data: { userId: user.id, name: '生活', icon: '🌿', color: '#5E8C61' },
  });
  const work = await prisma.folder.create({
    data: { userId: user.id, name: '工作', icon: '💼', color: '#3E7CB1' },
  });
  const idea = await prisma.folder.create({
    data: { userId: user.id, name: '灵感', icon: '✨', color: '#E07A4C' },
  });

  const todo = await prisma.tag.create({
    data: { userId: user.id, name: '待办', color: '#E07A4C' },
  });
  const spark = await prisma.tag.create({
    data: { userId: user.id, name: '灵感', color: '#7A5EA7' },
  });
  const quote = await prisma.tag.create({
    data: { userId: user.id, name: '摘录', color: '#3E7CB1' },
  });

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(9, 0, 0, 0);

  await prisma.note.create({
    data: {
      userId: user.id,
      folderId: life.id,
      title: '这周想认真做完的事',
      content: '不赶进度，只把真正想做的留下。',
      color: 'butter',
      pinned: true,
      tags: { create: [{ tagId: todo.id }] },
      checklist: {
        create: [
          { text: '给阳台的绿植换土', done: true, order: 0 },
          { text: '把拍立得照片收进册子', done: false, order: 1 },
          { text: '读完《小径分岔的花园》', done: false, order: 2 },
          { text: '早起去江边走一走', done: false, order: 3 },
        ],
      },
    },
  });

  await prisma.note.create({
    data: {
      userId: user.id,
      folderId: idea.id,
      title: '便签应该像一张纸',
      content:
        '它不该长成任务管理器。写完可以折起来，也可以用胶带再贴回去。颜色本身就是分类。',
      color: 'sky',
      favorite: true,
      tags: { create: [{ tagId: spark.id }] },
    },
  });

  await prisma.note.create({
    data: {
      userId: user.id,
      folderId: work.id,
      title: '周四评审要提的三件事',
      content:
        '1. 空状态不要只写「暂无数据」\n2. 提醒时间用自然语言\n3. 回收站里的东西，要让人感觉还能找回\n\n会后把结论补进这本笔记。',
      color: 'blush',
    },
  });

  await prisma.note.create({
    data: {
      userId: user.id,
      folderId: idea.id,
      title: '摘一句',
      content: '我们反复回到某些句子旁边，不是因为没读懂，而是因为当时的自己刚好需要它。',
      color: 'mint',
      tags: { create: [{ tagId: quote.id }] },
    },
  });

  await prisma.note.create({
    data: {
      userId: user.id,
      folderId: life.id,
      title: '明天上午',
      content: '九点前把快递拿到，顺路买一袋咖啡豆。记得带帆布袋。',
      color: 'peach',
      pinned: true,
      remindAt: tomorrow,
      tags: { create: [{ tagId: todo.id }] },
    },
  });

  await prisma.note.create({
    data: {
      userId: user.id,
      folderId: life.id,
      title: '晚饭可以简单一点',
      content: '番茄、鸡蛋、一把面。如果还有小葱，就撒一点。',
      color: 'lilac',
    },
  });

  await prisma.note.create({
    data: {
      userId: user.id,
      folderId: life.id,
      title: '已经搬完的箱子',
      content: '书、冬天的外套、那盏小台灯。剩下的下次再说。',
      color: 'sage',
      archived: true,
    },
  });

  console.log(`演示账号已就绪：${email}（密码见 server/.env 的 DEMO_PASSWORD）`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
