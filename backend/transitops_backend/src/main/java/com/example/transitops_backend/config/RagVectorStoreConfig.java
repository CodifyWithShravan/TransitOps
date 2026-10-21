package com.example.transitops_backend.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.ai.embedding.EmbeddingModel;
import org.springframework.ai.vectorstore.SimpleVectorStore;
import org.springframework.ai.vectorstore.VectorStore;
import org.springframework.ai.vectorstore.pinecone.PineconeVectorStore;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;
import org.springframework.util.StringUtils;

@Configuration
public class RagVectorStoreConfig {

    private static final Logger log = LoggerFactory.getLogger(RagVectorStoreConfig.class);

    @Bean
    @Primary
    public VectorStore vectorStore(
            EmbeddingModel embeddingModel,
            @Value("${spring.ai.vectorstore.pinecone.api-key:}") String pineconeApiKey,
            @Value("${spring.ai.vectorstore.pinecone.index-name:ai-rag-documents}") String indexName,
            @Value("${spring.ai.vectorstore.pinecone.namespace:default}") String namespace
    ) {
        if (StringUtils.hasText(pineconeApiKey) && !pineconeApiKey.startsWith("${")) {
            try {
                log.info("Connecting to Pinecone Vector Store (index: {})...", indexName);
                return PineconeVectorStore.builder(embeddingModel)
                        .apiKey(pineconeApiKey)
                        .indexName(indexName)
                        .namespace(namespace)
                        .build();
            } catch (Exception e) {
                log.warn("Failed to connect to Pinecone: {}. Falling back to in-memory SimpleVectorStore.", e.getMessage());
            }
        } else {
            log.info("No PINECONE_API_KEY detected. Using in-memory SimpleVectorStore for RAG.");
        }

        return SimpleVectorStore.builder(embeddingModel).build();
    }
}
