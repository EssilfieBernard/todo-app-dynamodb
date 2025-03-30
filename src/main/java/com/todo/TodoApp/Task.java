package com.todo.TodoApp;

import lombok.Getter;
import lombok.Setter;
import software.amazon.awssdk.enhanced.dynamodb.mapper.annotations.DynamoDbBean;
import software.amazon.awssdk.enhanced.dynamodb.mapper.annotations.DynamoDbPartitionKey;

@Getter
@Setter
@DynamoDbBean
public class Task {

    private String id;
    private String text;
    private boolean completed;

    @DynamoDbPartitionKey
    public String getId() {
        return id;
    }
}
