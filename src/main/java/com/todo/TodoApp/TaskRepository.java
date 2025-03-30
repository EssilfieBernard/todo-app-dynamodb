package com.todo.TodoApp;

import org.springframework.stereotype.Repository;
import software.amazon.awssdk.enhanced.dynamodb.*;
import software.amazon.awssdk.enhanced.dynamodb.model.ScanEnhancedRequest;
import software.amazon.awssdk.services.dynamodb.model.AttributeValue;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;
import java.util.stream.StreamSupport;

@Repository
public class TaskRepository{

    private final DynamoDbTable<Task> taskTable;

    public TaskRepository(DynamoDbEnhancedClient client) {
        taskTable = client.table("Todos", TableSchema.fromBean(Task.class));
    }

    public List<Task> getAllTasks() {
        return StreamSupport.stream(
                taskTable.scan().items().spliterator(), false
        )
        .collect(Collectors.toList());
    }

    public Optional<Task> findById(String id) {
        var key = Key.builder()
                .partitionValue(id)
                .build();
        var task = taskTable.getItem(t -> t.key(key));
        return Optional.ofNullable(task);
    }

    public Task save(Task task) {
        taskTable.putItem(task);
        return task;
    }

    public void deleteTask(String id) {
        var task = new Task();
        task.setId(id);
        taskTable.deleteItem(task);
    }

    public List<Task> findByCompleted(boolean completed) {
        Expression filterExpression = Expression.builder()
                .expression("completed = :val")
                .putExpressionValue(":val", AttributeValue.builder().bool(completed).build())
                .build();

        ScanEnhancedRequest scanRequest = ScanEnhancedRequest.builder()
                .filterExpression(filterExpression)
                .build();

        return StreamSupport.stream(taskTable.scan(scanRequest).items().spliterator(), false)
                .collect(Collectors.toList());
    }

    public boolean existsById(String id) {
        return findById(id).isPresent();
    }

    public void deleteAll(List<Task> tasks) {
        tasks.forEach(taskTable::deleteItem);
    }
}
