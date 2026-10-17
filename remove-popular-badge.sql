-- Run in Supabase SQL editor: hide the 'Most popular' badge until paid plans launch
update pricing_plans set badge = null where badge = 'Most popular';
