revoke execute on function public.protect_reportiq_artifact_history() from public,anon,authenticated;
revoke execute on function public.stale_reportiq_artifacts_on_definition_change() from public,anon,authenticated;
revoke execute on function public.stale_contractiq_definitions_on_question_change() from public,anon,authenticated;
revoke execute on function public.stale_contractiq_reports_on_material_source() from public,anon,authenticated;
revoke execute on function public.order_reportiq_generation_job() from public,anon,authenticated;
revoke execute on function public.record_reportiq_artifact_staleness() from public,anon,authenticated;
