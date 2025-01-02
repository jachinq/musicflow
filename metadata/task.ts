/**
 * 并发执行任务列表
 * @param task_unit 并发数
 * @param taskList 任务列表
 * @param singleTask 单个任务函数
 */
export const concurrence = async <T> (task_unit: number, taskList: T[], singleTask: (item: T) => any) => {
  const count = taskList.length;
  // 把总列表拆分成每个 n 个并发执行
  // const task_unit = 100;
  const tasks = [];
  for (let i = 0; i < count; i += task_unit) {
    const task = taskList.slice(i, i + task_unit);
    tasks.push(task);
  }

  const task_count = tasks.length;
  console.log("task count:", task_count);

  for (let i = 0; i < task_count; i++) {
    const task = tasks[i];
    const task_start_time = new Date().getTime();
    console.log(
      new Date().toLocaleString(),
      "task",
      i + 1,
      "start, count:",
      task.length
    );
    await Promise.all(
      task.map((item: T) => singleTask(item))
    );
    const task_end_time = new Date().getTime();
    console.log(
      new Date().toLocaleString(),
      "task",
      i + 1,
      "end, cost time:",
      (task_end_time - task_start_time) / 1000,
      "s"
    );
  }
}