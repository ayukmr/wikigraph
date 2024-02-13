" check if loaded
if exists('g:loaded_wikigraph')
  finish
endif
let g:loaded_wikigraph = 1

" server host
let g:wikigraph#host = get(g:, 'wikigraph#host', 'http://localhost:8000')

" focus file
func! wikigraph#focus_file() abort
  let l:file = expand('%:t:r')
  call wikigraph#focus(l:file)
endfunc

" focus index
func! wikigraph#focus(file) abort
  call jobstart(['curl', '-X', 'POST', g:wikigraph#host . '/focus/' . a:file])
endfunc
