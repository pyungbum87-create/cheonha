# sweep.sh stage k-values... ; uses HPX relative to work config k
st=$1; shift; base=$1; shift
for k in "$@"; do
  x=$(python3 -c "print($k/$base)")
  for m in $MS; do
    (HPX=$x node /home/claude/sim/sim.js /home/claude/work $st 8 ${m//_/ } | sed "s/^/k=$k /") &
  done
done; wait
