![produce300](./Produce300_1.gif)

**2020 제 21대 국회의원 선거**

---

| 일정                | 날짜                        |     시간      |
| ------------------- | :-------------------------- | :-----------: |
| 예비후보자등록 신청 | 2019. 12. 17(화) ~          |               |
| 후보자등록 신청     | 2020. 3. 26(목) ~ 3. 27(금) |               |
| 사전투표소 투표     | 2020. 4. 10(금) ~ 4. 11(토) | 06:00 ~ 18:00 |
| 선거일 투표         | 2020. 4. 15(수)             | 06:00 ~ 18:00 |

## **yarn**

```
> npm install -g npm
> npm -g yarn
> yarn install
> yarn dev
```

-   만약  
    `error An unexpected error occurred: "https://registry.yarnpkg.com/debug/-/debug-2.6.9.tgz: self signed certificate in certificate chain".`  
    에러 발생시  
    `> yarn config set "strict-ssl" false`

## **접속 사이트**

[4월 총선 알리미](https://produce300.com/)

## **업데이트 현황**

2020.02.06

-   우측 상단을 누르면 행정동 경계를 활성화 할 수 있으며, 이 후 지도의 임의 부분을 누를 경우 해당 행정동이 속하는 국회의원 선거구를 조회할 수 있습니다.

    2020.02.07

-   국회의원 선거구 별로 배경 색상이 다르게 표출됩니다.
-   20대 총선 결과 조회 기능 추가.
-   좌측 상단 현재위치 조회 기능 추가.

    2020.02.09

-   기존 Node만 사용하던 방식에서 프론트 : Webpack / 백엔드 : Node로 전환
-   행정동 전체 표시 -> 성능 이슈 발생 : mapshaper 사용해 선거구 geojson 데이터 생성

    2020.02.17

-   예비후보자 조회 기능 추가
-   선거구 검색 기능 추가
-   디자인 수정

## **참조**

-   행정동 경계 GeoJson 파일 : [https://github.com/vuski/admdongkor](https://github.com/vuski/admdongkor)
-   선거구 및 선거 관련 자료 : [http://info.nec.go.kr/](http://info.nec.go.kr/)

## **제작자**

-   [나유리](https://github.com/YuriNaDev)
-   [어호선](https://github.com/EooHoSun)
-   [양호석](https://github.com/BryceYangS)
