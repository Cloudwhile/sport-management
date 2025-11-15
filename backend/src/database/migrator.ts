import { migrator, seeder } from './umzug.js';
import { testConnection } from './connection.js';

const command = process.argv[2];
const type = process.argv[3] || 'migration'; // 'migration' 或 'seed'

async function main() {
  // 先测试数据库连接
  const connected = await testConnection();
  if (!connected) {
    console.error('❌ 数据库连接失败，退出');
    process.exit(1);
  }

  const executor = type === 'seed' ? seeder : migrator;
  const typeName = type === 'seed' ? '种子数据' : '迁移';

  try {
    switch (command) {
      case 'up':
      case 'migrate':
        console.log(`⏫ 执行${typeName}...`);
        await executor.up();
        console.log(`✅ ${typeName}执行成功`);
        break;

      case 'down':
      case 'rollback':
        console.log(`⏬ 回滚${typeName}...`);
        await executor.down({ step: 1 });
        console.log(`✅ ${typeName}回滚成功`);
        break;

      case 'reset':
        console.log(`🔄 重置所有${typeName}...`);
        await executor.down({ to: 0 as any });
        console.log(`✅ 所有${typeName}已重置`);
        break;

      case 'status':
      case 'pending':
        console.log(`📋 ${typeName}状态:\n`);
        const pending = await executor.pending();
        const executed = await executor.executed();

        console.log(`已执行 (${executed.length}):`);
        executed.forEach((m) => console.log(`  ✅ ${m.name}`));

        console.log(`\n待执行 (${pending.length}):`);
        pending.forEach((m) => console.log(`  ⏳ ${m.name}`));
        break;

      case 'executed':
        const executedList = await executor.executed();
        console.log(`已执行的${typeName} (${executedList.length}):`);
        executedList.forEach((m) => console.log(`  ✅ ${m.name}`));
        break;

      default:
        console.log(`
数据库迁移管理工具

用法:
  npm run db:migrate [command] [type]

命令 (command):
  up, migrate       执行所有待执行的迁移/种子
  down, rollback    回滚上一次迁移/种子
  reset             重置所有迁移/种子（危险操作）
  status, pending   查看迁移/种子状态
  executed          查看已执行的迁移/种子

类型 (type):
  migration         数据库迁移（默认）
  seed              种子数据

示例:
  npm run db:migrate up              # 执行迁移
  npm run db:migrate down            # 回滚迁移
  npm run db:migrate status          # 查看迁移状态
  npm run db:migrate up seed         # 执行种子数据
  npm run db:migrate status seed     # 查看种子数据状态
        `);
        process.exit(0);
    }
  } catch (error) {
    console.error(`❌ ${typeName}执行失败:`, error);
    process.exit(1);
  }

  process.exit(0);
}

main();
