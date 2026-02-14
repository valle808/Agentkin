import 'package:flutter/material.dart';
import 'motor/motor_factory.dart';
import 'data/gundb_adapter.dart';
import 'logic/task_manager.dart';
import 'ui/dashboard.dart';

void main() async {
  // 1. Initialize Motor (Stubbed)
  final motor = MotorFactory.create('openai', {'apiKey': 'sk-proj-placeholder'});
  print('Motor Initialized: ${motor.id}');

  // 2. Initialize Data Layer
  final dataStore = GunDBAdapter();
  await dataStore.initialize({'peerId': 'kin-node-1'});
  
  // 3. Initialize Task Manager
  final taskManager = TaskManager(dataStore);

  // 4. Run App with UI
  runApp(AgentKinApp(taskManager: taskManager));
}

class AgentKinApp extends StatelessWidget {
  final TaskManager taskManager;

  const AgentKinApp({super.key, required this.taskManager});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'AgentKin Decentralized',
      theme: ThemeData(
        colorScheme: ColorScheme.fromSeed(seedColor: const Color(0xFF00BFA5)), // Kinship Green
        useMaterial3: true,
      ),
      home: DashboardScreen(taskManager: taskManager),
    );
  }
}
