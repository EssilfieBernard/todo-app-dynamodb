package com.todo.TodoApp;

import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class TaskService {
    private final TaskRepository taskRepository;

    public List<Task> getTasks() {
        return taskRepository.getAllTasks();
    }

    public List<Task> getActiveTasks() {
        return taskRepository.findByCompleted(false);
    }

    public List<Task> getCompletedTasks() {
        return taskRepository.findByCompleted(true);
    }

    public Task createTask(Task task) {
        if (task.getId() == null)
            task.setId(UUID.randomUUID().toString());

        return taskRepository.save(task);
    }

    public Task updateTask(String id, Task updatedTask) {
        return taskRepository.findById(id)
                .map(task -> {
                    task.setText(updatedTask.getText());
                    task.setCompleted(updatedTask.isCompleted());
                    return taskRepository.save(task);
                }).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Task not found"));
    }

    public void deleteTask(String id) {
        if (!taskRepository.existsById(id))
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Task not found");
        taskRepository.deleteTask(id);

    }

    public void deleteCompletedTasks() {
        var completedTasks = taskRepository.findByCompleted(true);
        taskRepository.deleteAll(completedTasks);
    }
}
