import 'package:flutter/material.dart';
import '../data/models/task_model.dart';
import '../logic/task_manager.dart';
import 'create_task_screen.dart';

class DashboardScreen extends StatefulWidget {
  final TaskManager taskManager;

  const DashboardScreen({super.key, required this.taskManager});

  @override
  State<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends State<DashboardScreen> {
  List<Task> _tasks = [];

  @override
  void initState() {
    super.initState();
    _loadTasks();
  }

  Future<void> _loadTasks() async {
    // In a real app, this would stream from GunDB
    // For now, we mock some data + fetch from local store
    setState(() {
      _tasks = [
        Task(
          id: '1',
          title: 'Design AgentKin Logo',
          description: 'Cyberpunk style.',
          budget: 150.0,
          currency: 'SOL',
          status: TaskStatus.open,
          ownerPub: 'pub-key-1',
        ),
        Task(
          id: '2',
          title: 'Ghost Mission',
          description: 'Encrypted',
          budget: 500.0,
          currency: 'BTC',
          status: TaskStatus.open,
          ownerPub: 'pub-key-2',
          isGhost: true,
          encryptedData: 'ENCRYPTED_DATA_BLOB',
        ),
      ];
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('AgentKin Dashboard'),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: _loadTasks,
          ),
        ],
      ),
      body: ListView.builder(
        itemCount: _tasks.length,
        itemBuilder: (context, index) {
          final task = _tasks[index];
          return Card(
            margin: const EdgeInsets.all(8.0),
            child: ListTile(
              leading: Icon(
                task.isGhost ? Icons.lock : Icons.work_outline,
                color: task.isGhost ? Colors.redAccent : Colors.blue,
              ),
              title: Text(task.isGhost ? 'Ghost Task (Encrypted)' : task.title),
              subtitle: Text(
                '${task.budget} ${task.currency}',
                style: const TextStyle(fontWeight: FontWeight.bold),
              ),
              trailing: const Icon(Icons.arrow_forward_ios, size: 16),
              onTap: () {
                // Navigate to Task Details
              },
            ),
          );
        },
      ),
      floatingActionButton: FloatingActionButton(
        onPressed: () {
            Navigator.push(
              context,
              MaterialPageRoute(builder: (_) => CreateTaskScreen(taskManager: widget.taskManager)),
            );
        },
        child: const Icon(Icons.add),
      ),
    );
  }
}
