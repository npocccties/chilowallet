#!/bin/sh
# Open Badge 検証サービス（obv-validator）の状態を確認し、異常時の再起動と通知を行う。
# cron で数分おきに実行する（README「Open Badge 検証サービスの監視」を参照）。
#
# - unhealthy なら再起動し、通知する。正常に戻らないまま再起動が上限に達したら、再起動をやめて通知する
#   （Docker の restart: always はプロセスが終了したときだけ再起動し、unhealthy では再起動しないため）
# - 停止・見つからないなど再起動の対象外の異常は、通知だけ行う
# - 正常（healthy）に戻ったら通知し、再起動の回数を数え直す
# - 異常が続いている間、同じ通知は繰り返さない
#
# 設定（.env。いずれも任意。通知先がどちらも未設定なら標準出力にだけ出す）
#   BADGE_VERIFIER_ALERT_WEBHOOK_URL : Slack の Incoming Webhook の URL
#   BADGE_VERIFIER_ALERT_MAIL_TO     : 通知メールの宛先（ホストの mail コマンドで送る）
#   BADGE_VERIFIER_MAX_RESTARTS      : 正常に戻るまでに再起動する上限回数（既定 3）

DIR=$(cd "$(dirname "$0")" && pwd)
cd "$DIR" || exit 1
if [ -f ./.env ]; then
  . ./.env
fi

PROJECT=${BADGE_VERIFIER_COMPOSE_PROJECT:-chilowallet-app}
IMPACT="ウォレットでバッジのインポートができません（他の機能は利用できます）。"
STATE_FILE=${BADGE_VERIFIER_STATE_FILE:-$DIR/.badge_verifier_state}
MAX_RESTARTS=${BADGE_VERIFIER_MAX_RESTARTS:-3}
NAME="Open Badge 検証サービス（$PROJECT / obv-validator）"

container=$(docker ps -aq \
  --filter "label=com.docker.compose.project=$PROJECT" \
  --filter "label=com.docker.compose.service=obv-validator" | head -n 1)
if [ -z "$container" ]; then
  status="not found"
else
  status=$(docker inspect -f '{{.State.Status}}{{if .State.Health}}/{{.State.Health.Status}}{{end}}' "$container" 2>/dev/null)
fi

# 状態ファイル：「<ok|ng|limit> <これまでの再起動回数>」
previous=ok
restarts=0
if [ -f "$STATE_FILE" ]; then
  read -r previous restarts < "$STATE_FILE"
fi
previous=${previous:-ok}
case "$restarts" in
  '' | *[!0-9]*) restarts=0 ;;
esac

save_state() {
  echo "$1 $2" > "$STATE_FILE"
}

notify() {
  message="[$(hostname)] $1"
  echo "$message"
  sent=0
  if [ -n "$BADGE_VERIFIER_ALERT_WEBHOOK_URL" ]; then
    escaped=$(printf '%s' "$message" | sed 's/\\/\\\\/g; s/"/\\"/g')
    if curl -fsS -m 10 -X POST -H 'Content-Type: application/json' \
      --data "{\"text\": \"$escaped\"}" "$BADGE_VERIFIER_ALERT_WEBHOOK_URL" > /dev/null; then
      sent=1
    else
      echo "Slack への通知に失敗しました" >&2
      return 1
    fi
  fi
  if [ -n "$BADGE_VERIFIER_ALERT_MAIL_TO" ]; then
    if printf '%s\n' "$message" | mail -s "$2" "$BADGE_VERIFIER_ALERT_MAIL_TO"; then
      sent=1
    else
      echo "メールでの通知に失敗しました" >&2
      return 1
    fi
  fi
  if [ "$sent" -eq 0 ]; then
    echo "通知先が未設定です（BADGE_VERIFIER_ALERT_WEBHOOK_URL / BADGE_VERIFIER_ALERT_MAIL_TO）" >&2
  fi
  return 0
}

case "$status" in
  running/healthy)
    if [ "$previous" != ok ]; then
      notify "${NAME}が復旧しました（状態: $status、それまでの自動再起動: $restarts 回）。" \
        "[復旧] Open Badge 検証サービス（$PROJECT）" || exit 1
    fi
    save_state ok 0
    ;;

  running/starting)
    # 起動中（再起動の直後を含む）。結果が出るまで判断しない。
    ;;

  running/unhealthy)
    if [ "$restarts" -lt "$MAX_RESTARTS" ]; then
      restarts=$((restarts + 1))
      # 通知に失敗しても再起動の回数は残す（上限を超えて再起動し続けないため）。
      save_state ng "$restarts"
      if docker restart "$container" > /dev/null; then
        result="再起動しました（$restarts/$MAX_RESTARTS 回目）"
      else
        result="再起動に失敗しました（$restarts/$MAX_RESTARTS 回目）"
      fi
      notify "${NAME}が正常ではないため（状態: $status）、$result。$IMPACT" \
        "[警告] Open Badge 検証サービスを再起動（$PROJECT）" || exit 1
    elif [ "$previous" != limit ]; then
      notify "${NAME}が $MAX_RESTARTS 回再起動しても正常に戻りません（状態: $status）。自動での再起動をやめます。サーバーを確認してください。$IMPACT" \
        "[要対応] Open Badge 検証サービスが復旧しません（$PROJECT）" || exit 1
      save_state limit "$restarts"
    fi
    ;;

  *)
    # 停止・見つからないなど。再起動の対象外なので通知だけ行う。
    if [ "$previous" = ok ]; then
      notify "${NAME}が正常ではありません（状態: $status）。サーバーを確認してください。$IMPACT" \
        "[警告] Open Badge 検証サービスの異常（$PROJECT）" || exit 1
      save_state ng "$restarts"
    fi
    ;;
esac
