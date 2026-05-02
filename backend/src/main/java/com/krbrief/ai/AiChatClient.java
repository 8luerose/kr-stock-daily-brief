package com.krbrief.ai;

import java.util.Map;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;
import org.springframework.web.server.ResponseStatusException;

@Component
public class AiChatClient {
  private static final ParameterizedTypeReference<Map<String, Object>> MAP_TYPE =
      new ParameterizedTypeReference<>() {};

  private final RestClient http;

  public AiChatClient(@Value("${ai.baseUrl:http://ai-service:8100}") String baseUrl) {
    this.http = RestClient.builder().requestFactory(new SimpleClientHttpRequestFactory()).baseUrl(baseUrl).build();
  }

  public Map<String, Object> chat(Map<String, Object> request) {
    try {
      Map<String, Object> res =
          http
              .post()
              .uri("/chat")
              .contentType(MediaType.APPLICATION_JSON)
              .accept(MediaType.APPLICATION_JSON)
              .body(request == null ? Map.of() : request)
              .retrieve()
              .body(MAP_TYPE);
      if (res == null) {
        throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "ai_service_empty_response");
      }
      return res;
    } catch (ResponseStatusException e) {
      throw e;
    } catch (RestClientException e) {
      throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "ai_service_chat_error", e);
    }
  }
}
