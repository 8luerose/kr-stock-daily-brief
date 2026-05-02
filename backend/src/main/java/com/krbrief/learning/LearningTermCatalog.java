package com.krbrief.learning;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;
import org.springframework.stereotype.Service;

@Service
public class LearningTermCatalog {
  private static final int DEFAULT_LIMIT = 80;
  private static final int MAX_LIMIT = 120;

  private final List<LearningTermDto> terms = buildTerms();
  private final Map<String, LearningTermDto> byId = indexById(terms);

  public List<LearningTermDto> list(String query, String category, Integer limit) {
    String q = normalize(query);
    String c = normalize(category);
    int safeLimit = normalizeLimit(limit);

    return terms.stream()
        .filter(t -> c.isBlank() || normalize(t.category()).equals(c))
        .filter(t -> q.isBlank() || searchableText(t).contains(q))
        .sorted(Comparator.comparing(LearningTermDto::category).thenComparing(LearningTermDto::term))
        .limit(safeLimit)
        .toList();
  }

  public Optional<LearningTermDto> findById(String id) {
    if (id == null || id.isBlank()) {
      return Optional.empty();
    }
    return Optional.ofNullable(byId.get(normalize(id)));
  }

  public List<LearningTermDto> match(String question, String preferredTermId) {
    List<LearningTermDto> matched = new ArrayList<>();
    findById(preferredTermId).ifPresent(matched::add);

    String q = normalize(question);
    if (!q.isBlank()) {
      for (LearningTermDto term : terms) {
        if (matched.stream().anyMatch(x -> x.id().equals(term.id()))) {
          continue;
        }
        if (q.contains(normalize(term.term()))
            || term.relatedTerms().stream().map(this::normalize).anyMatch(q::contains)) {
          matched.add(term);
        }
        if (matched.size() >= 4) {
          break;
        }
      }
    }

    if (matched.isEmpty()) {
      findById("price-change-rate").ifPresent(matched::add);
      findById("volume").ifPresent(matched::add);
    }
    return matched;
  }

  private String searchableText(LearningTermDto term) {
    return normalize(
        String.join(
            " ",
            term.id(),
            term.term(),
            term.category(),
            term.plainDefinition(),
            term.whyItMatters(),
            term.beginnerCheck(),
            term.caution(),
            String.join(" ", term.relatedTerms()),
            String.join(" ", term.exampleQuestions())));
  }

  private int normalizeLimit(Integer limit) {
    if (limit == null || limit <= 0) {
      return DEFAULT_LIMIT;
    }
    return Math.min(limit, MAX_LIMIT);
  }

  private String normalize(String value) {
    return value == null ? "" : value.trim().toLowerCase(Locale.ROOT);
  }

  private static Map<String, LearningTermDto> indexById(List<LearningTermDto> terms) {
    Map<String, LearningTermDto> map = new LinkedHashMap<>();
    for (LearningTermDto term : terms) {
      map.put(term.id(), term);
    }
    return Map.copyOf(map);
  }

  private static List<LearningTermDto> buildTerms() {
    return List.of(
        term(
            "kospi",
            "KOSPI",
            "시장",
            "한국거래소 유가증권시장에 상장된 큰 기업들의 주가 흐름을 보여주는 대표 지수입니다.",
            "대형주 중심 시장 분위기를 보는 기준이 됩니다.",
            "오늘 종목 움직임이 개별 이슈인지, 시장 전체 흐름을 따라간 것인지 함께 확인하세요.",
            "지수가 올라도 모든 종목이 오르는 것은 아닙니다.",
            List.of("코스피", "종합주가지수", "시장지수"),
            List.of("KOSPI가 오르면 내 종목도 좋은 건가요?", "KOSPI와 KOSDAQ은 어떻게 달라요?")),
        term(
            "kosdaq",
            "KOSDAQ",
            "시장",
            "기술주와 중소형 성장주가 많이 포함된 한국 주식 시장 지수입니다.",
            "변동성이 큰 성장주 분위기를 볼 때 자주 확인합니다.",
            "급등 종목이 많을수록 거래량과 재료 지속성을 함께 보세요.",
            "KOSDAQ은 변동성이 커서 하루 등락만 보고 판단하면 위험할 수 있습니다.",
            List.of("코스닥", "성장주", "중소형주"),
            List.of("KOSDAQ 종목은 왜 변동성이 큰가요?", "KOSDAQ 상승 TOP3를 볼 때 뭘 확인해야 해요?")),
        term(
            "price-change-rate",
            "등락률",
            "시장",
            "전일 종가와 비교해 오늘 가격이 몇 퍼센트 오르거나 내렸는지 보여주는 숫자입니다.",
            "하루 동안 시장이 어떤 종목에 강하게 반응했는지 빠르게 볼 수 있습니다.",
            "등락률만 보지 말고 거래량, 공시, 뉴스, 시장 전체 흐름을 같이 확인하세요.",
            "가격이 낮거나 거래가 적은 종목은 등락률이 과장되어 보일 수 있습니다.",
            List.of("상승률", "하락률", "전일대비", "rate"),
            List.of("등락률이 높으면 좋은 종목인가요?", "전일대비 등락률은 어떻게 계산해요?")),
        term(
            "volume",
            "거래량",
            "시장",
            "하루 동안 거래된 주식 수입니다.",
            "가격 움직임에 실제 참여가 있었는지 확인하는 기본 지표입니다.",
            "급등/급락이 거래량 증가와 함께 나타났는지 확인하세요.",
            "거래량이 갑자기 늘었다고 항상 좋은 신호는 아닙니다.",
            List.of("거래 주식 수", "volume", "수급"),
            List.of("거래량이 늘면 왜 중요해요?", "거래량 없이 오른 종목은 어떻게 봐야 해요?")),
        term(
            "trading-value",
            "거래대금",
            "시장",
            "거래량에 가격을 곱한 값으로, 시장에서 실제로 오간 돈의 규모입니다.",
            "비싼 주식과 싼 주식을 함께 비교할 때 거래량보다 현실적인 관심도를 보여줍니다.",
            "거래대금이 큰 종목은 많은 자금이 움직였는지 확인하는 출발점으로 보세요.",
            "단기 이슈로 거래대금이 일시적으로 커질 수 있습니다.",
            List.of("대금", "money flow", "유동성"),
            List.of("거래량과 거래대금은 뭐가 달라요?", "거래대금이 큰 종목은 안전한가요?")),
        term(
            "market-cap",
            "시가총액",
            "시장",
            "현재 주가에 발행 주식 수를 곱한 회사의 시장 평가 규모입니다.",
            "대형주와 소형주의 변동성, 안정성, 시장 영향력을 구분하는 기준이 됩니다.",
            "같은 등락률이라도 시가총액이 큰 회사와 작은 회사의 의미가 다를 수 있습니다.",
            "시가총액이 크다고 반드시 저평가나 고평가를 뜻하지는 않습니다.",
            List.of("시총", "market cap", "기업 규모"),
            List.of("시가총액은 왜 봐야 해요?", "시총이 작으면 위험한가요?")),
        term(
            "ohlcv",
            "OHLCV",
            "차트",
            "시가, 고가, 저가, 종가, 거래량을 묶어 부르는 차트 데이터입니다.",
            "일봉, 주봉, 월봉 차트와 이벤트 탐지의 기본 재료가 됩니다.",
            "종가만 보지 말고 하루 중 가격 범위와 거래량을 함께 보세요.",
            "데이터 제공처에 따라 수정주가나 비교 기준이 다를 수 있습니다.",
            List.of("시가", "고가", "저가", "종가", "일봉", "캔들"),
            List.of("OHLCV는 차트에서 어떻게 읽어요?", "종가가 왜 중요해요?")),
        term(
            "candlestick",
            "캔들차트",
            "차트",
            "한 기간의 시가, 고가, 저가, 종가를 하나의 막대로 보여주는 차트입니다.",
            "가격이 어디서 시작해 어디까지 움직였고 어디서 끝났는지 한눈에 볼 수 있습니다.",
            "긴 꼬리, 큰 몸통, 거래량 증가가 함께 나타났는지 확인하세요.",
            "캔들 모양 하나만으로 다음 방향을 확정할 수 없습니다.",
            List.of("봉차트", "일봉", "주봉", "월봉"),
            List.of("일봉과 월봉은 어떻게 다르게 봐요?", "캔들 꼬리는 무슨 뜻이에요?")),
        term(
            "moving-average",
            "이동평균선",
            "차트",
            "최근 여러 날의 평균 가격을 선으로 이어 가격 흐름을 부드럽게 보여주는 지표입니다.",
            "단기 소음보다 큰 흐름을 확인할 때 도움이 됩니다.",
            "현재 가격이 주요 이동평균선 위인지 아래인지, 기울기가 어떤지 확인하세요.",
            "이동평균선은 과거 가격으로 계산되므로 신호가 늦을 수 있습니다.",
            List.of("이평선", "5일선", "20일선", "추세"),
            List.of("이동평균선 위에 있으면 좋은 건가요?", "5일선과 20일선은 뭐가 달라요?")),
        term(
            "volatility",
            "변동성",
            "리스크",
            "가격이 짧은 기간에 얼마나 크게 흔들리는지를 뜻합니다.",
            "초보자가 감당할 수 있는 손실 폭을 생각할 때 가장 먼저 봐야 합니다.",
            "최근 급등락 빈도와 거래량 변화를 함께 확인하세요.",
            "변동성이 큰 종목은 수익 기회와 손실 위험이 함께 커집니다.",
            List.of("위험", "급등락", "가격 흔들림"),
            List.of("변동성이 크다는 건 위험하다는 뜻인가요?", "초보자는 변동성을 어떻게 봐야 해요?")),
        term(
            "limit-up-down",
            "상한가/하한가",
            "리스크",
            "하루에 오르거나 내릴 수 있는 최대 가격 제한에 도달한 상태입니다.",
            "매수나 매도 주문이 한쪽으로 몰릴 만큼 강한 이슈가 있었을 가능성을 보여줍니다.",
            "왜 제한폭까지 갔는지 공시, 뉴스, 거래량, 다음 날 흐름을 확인하세요.",
            "상한가가 다음 날 상승을 보장하지 않고, 하한가가 항상 저점이라는 뜻도 아닙니다.",
            List.of("가격제한폭", "급등", "급락"),
            List.of("상한가 종목은 왜 조심해야 해요?", "하한가가 나오면 바닥인가요?")),
        term(
            "per",
            "PER",
            "재무",
            "주가를 주당순이익으로 나눈 값으로, 이익 대비 주가가 어느 정도 평가받는지 보는 지표입니다.",
            "같은 업종 안에서 상대적으로 비싼지 싼지 비교할 때 참고합니다.",
            "동종 업계 평균, 이익 성장률, 일회성 이익 여부를 함께 보세요.",
            "PER이 낮다고 항상 저평가가 아니고, 적자 기업에는 적용이 어려울 수 있습니다.",
            List.of("주가수익비율", "이익", "밸류에이션"),
            List.of("PER이 낮으면 무조건 좋은가요?", "PER은 어떤 회사끼리 비교해야 해요?")),
        term(
            "pbr",
            "PBR",
            "재무",
            "주가를 주당순자산으로 나눈 값으로, 회사의 장부상 순자산 대비 시장 평가를 보여줍니다.",
            "자산이 중요한 업종이나 저평가 논의를 볼 때 자주 사용됩니다.",
            "업종 특성, 자산의 질, 수익성을 함께 확인하세요.",
            "PBR이 낮아도 사업 전망이 나쁘면 오래 낮게 머물 수 있습니다.",
            List.of("주가순자산비율", "순자산", "밸류에이션"),
            List.of("PBR 1배는 무슨 뜻이에요?", "PBR이 낮은 종목은 안전한가요?")),
        term(
            "roe",
            "ROE",
            "재무",
            "자기자본으로 얼마나 효율적으로 이익을 냈는지 보여주는 수익성 지표입니다.",
            "회사가 가진 자본을 잘 굴리는지 확인하는 데 도움이 됩니다.",
            "ROE가 일시적인지, 꾸준히 유지되는지 확인하세요.",
            "부채가 많아도 ROE가 높게 보일 수 있어 재무구조를 함께 봐야 합니다.",
            List.of("자기자본이익률", "수익성", "이익률"),
            List.of("ROE가 높으면 좋은 회사인가요?", "ROE와 PER은 같이 봐야 하나요?")),
        term(
            "eps",
            "EPS",
            "재무",
            "회사의 순이익을 주식 수로 나눈 주당순이익입니다.",
            "PER 계산의 기반이며, 주주 몫의 이익을 볼 때 사용합니다.",
            "EPS가 꾸준히 늘어나는지, 일회성 요인이 있는지 확인하세요.",
            "주식 수 변화나 일회성 이익 때문에 EPS가 왜곡될 수 있습니다.",
            List.of("주당순이익", "순이익", "이익"),
            List.of("EPS가 늘면 주가도 오르나요?", "EPS와 PER은 어떻게 연결돼요?")),
        term(
            "dividend-yield",
            "배당수익률",
            "재무",
            "현재 주가 대비 1년 배당금이 어느 정도인지 보여주는 비율입니다.",
            "배당을 중시하는 투자자가 현금흐름을 비교할 때 참고합니다.",
            "배당이 꾸준했는지, 이익으로 감당 가능한지 확인하세요.",
            "주가 급락으로 배당수익률이 높아 보이는 경우도 있습니다.",
            List.of("배당", "현금배당", "배당률"),
            List.of("배당수익률이 높으면 좋은 종목인가요?", "배당주는 뭘 확인해야 해요?")),
        term(
            "disclosure",
            "공시",
            "공시/뉴스",
            "상장사가 투자자에게 알려야 할 중요한 정보를 공식적으로 공개하는 문서입니다.",
            "실적, 계약, 증자, 최대주주 변경처럼 주가에 영향을 줄 수 있는 근거 자료입니다.",
            "뉴스보다 먼저 공시 원문과 날짜, 금액, 조건을 확인하세요.",
            "공시는 중요하지만 내용 해석에 따라 시장 반응이 달라질 수 있습니다.",
            List.of("DART", "전자공시", "사업보고서", "계약공시"),
            List.of("공시는 어디서 확인해요?", "공시가 나오면 무조건 주가가 움직이나요?")),
        term(
            "dart",
            "DART",
            "공시/뉴스",
            "금융감독원의 전자공시시스템으로, 기업 공시 원문을 확인할 수 있는 공식 서비스입니다.",
            "뉴스나 소문이 아니라 회사가 제출한 원문 근거를 확인할 때 사용합니다.",
            "공시 제목, 제출일, 정정 여부, 핵심 금액을 확인하세요.",
            "공시 원문은 어렵기 때문에 핵심 항목을 분리해 읽어야 합니다.",
            List.of("전자공시", "금융감독원", "공시"),
            List.of("DART에서 뭘 먼저 봐야 해요?", "정정공시는 왜 중요해요?")),
        term(
            "board-mentions",
            "종목토론방 언급량",
            "공시/뉴스",
            "네이버 금융 종목토론방에서 특정 종목이 얼마나 자주 언급되는지 보는 관심도 지표입니다.",
            "개인 투자자 관심이 갑자기 몰리는 종목을 찾는 보조 신호가 됩니다.",
            "언급량 증가가 실제 뉴스, 공시, 거래량 증가와 연결되는지 확인하세요.",
            "토론방 글은 공식 정보가 아니며 루머나 과장이 섞일 수 있습니다.",
            List.of("최다 언급", "게시물 수", "네이버 토론방", "관심도"),
            List.of("언급량이 많으면 좋은 종목인가요?", "토론방 데이터는 얼마나 믿어도 돼요?")),
        term(
            "liquidity",
            "유동성",
            "리스크",
            "원하는 가격에 주식을 사고팔기 쉬운 정도입니다.",
            "유동성이 낮으면 작은 주문에도 가격이 크게 흔들릴 수 있습니다.",
            "거래량, 거래대금, 호가 간격을 함께 보세요.",
            "유동성이 낮은 종목은 손절이나 매도 자체가 어려울 수 있습니다.",
            List.of("거래대금", "호가", "매매 용이성"),
            List.of("유동성이 낮으면 왜 위험해요?", "거래대금으로 유동성을 볼 수 있나요?")),
        term(
            "sector-theme",
            "섹터/테마",
            "시장",
            "비슷한 산업이나 이슈로 묶이는 종목 그룹입니다.",
            "같은 재료에 여러 종목이 함께 움직이는지 볼 때 도움이 됩니다.",
            "대장주, 후발주, 실제 실적 연결 여부를 구분하세요.",
            "테마는 기대감으로 급등락할 수 있어 근거 지속성을 확인해야 합니다.",
            List.of("업종", "테마주", "대장주"),
            List.of("테마주는 왜 같이 움직여요?", "대장주와 후발주는 뭐가 달라요?")));
  }

  private static LearningTermDto term(
      String id,
      String term,
      String category,
      String plainDefinition,
      String whyItMatters,
      String beginnerCheck,
      String caution,
      List<String> relatedTerms,
      List<String> exampleQuestions) {
    return new LearningTermDto(
        id,
        term,
        category,
        plainDefinition,
        whyItMatters,
        beginnerCheck,
        caution,
        List.copyOf(relatedTerms),
        List.copyOf(exampleQuestions));
  }
}
