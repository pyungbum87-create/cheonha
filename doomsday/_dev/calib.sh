# 각 챕터: 이전 강화 / 목표 강화 로 각각 N판
N=${N:-10}
M=("0 0 0 0" "5 5 2 2" "7 7 3 3" "9 9 4 4" "11 11 5 5" "13 13 6 6" "15 15 7 7" "17 17 8 8")
for i in ${STAGES:-0 1 2 3 4 5 6 7}; do
  p=$(( i>0 ? i-1 : 0 ))
  ( node /home/claude/sim/sim.js /home/claude/work $i $N ${M[$p]} | sed "s/^/[prev] /" ) &
  [ $i -gt 0 ] && ( node /home/claude/sim/sim.js /home/claude/work $i $N ${M[$i]} | sed "s/^/[goal] /" ) &
done; wait
