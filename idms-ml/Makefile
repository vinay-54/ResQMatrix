.PHONY: data train verify

# Full ML-1 pipeline — run in order
data:
	python data/download_datasets.py
	python data/preprocess.py
	python data/augment.py
	python data/load_to_mongo.py

# ML-2 — train all nodes
train:
	python model/trainer.py --node DSN-KL2018   --hours 2916
	python model/trainer.py --node DSN-GDV001   --hours 8760
	python model/trainer.py --node DSN-IMDAP    --hours 8760
	python model/trainer.py --node DSN-SYNTHETIC --hours 5000

# Verify everything is working
verify:
	python -c "from data.fetch_data import get_readings; \
	           df = get_readings('DSN-KL2018', 720); \
	           print(f'DSN-KL2018: {len(df)} records loaded')"

	python -c "from model.predictor import predict; \
	           r = predict('DSN-KL2018', hours=6); \
	           print(f'Prediction OK — method: {r[\"method\"]}, ' \
	                 f'forecast hours: {len(r[\"forecast\"])}')"

